// convex/ai.ts
// Gemini-powered AI assistant.
// All Gemini API calls happen in Actions (never mutations); the user's Gemini key
// never leaves the server. The AI may only PROPOSE relay switches — nothing is
// switched until the user confirms (resolveRelayProposal).

import { v, ConvexError } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getHubReadAccess, requireUser } from "./access";
import { DEFAULT_TARIFF_NGN } from "./telemetry";

const GEMINI_API_BASE  = "https://generativelanguage.googleapis.com/v1beta";
// Primary text model; falls back to gemini-2.5-flash if 404/503
const TEXT_MODELS      = ["gemini-3.5-flash", "gemini-2.5-flash"];
const LIVE_MODEL       = "models/gemini-3.8-live";
const MAX_HISTORY      = 20;
const TTL_MS           = 7 * 24 * 60 * 60 * 1000;
const PROPOSAL_TTL_MS  = 5 * 60 * 1000;   // a relay proposal can be confirmed for 5 minutes

// ── Function declarations for Gemini function-calling ─────────────────────
const FUNCTION_DECLARATIONS = [
  {
    name: "propose_relay_switch",
    description:
      "Propose turning one circuit's relay ON or OFF. This does NOT switch anything: the user must tap Confirm. Use only when the user explicitly asks to switch a specific circuit. Never propose switching all circuits.",
    parameters: {
      type: "OBJECT",
      properties: {
        channel: { type: "INTEGER", description: "Channel number exactly as shown in the circuit list, e.g. 3 for CH3" },
        state:   { type: "BOOLEAN", description: "true = ON, false = OFF" },
      },
      required: ["channel", "state"],
    },
  },
  {
    name: "get_weather",
    description:
      "Fetch the current weather conditions for the user's location. Call this when the user asks about weather or when weather context helps explain energy usage (e.g., high AC load on a hot day).",
    parameters: {
      type: "OBJECT",
      properties: {
        city: {
          type:        "STRING",
          description: "City name to get weather for. Default to 'Lagos' if unknown.",
        },
      },
      required: ["city"],
    },
  },
];

function systemPrompt(tariff: { tariffPerKwh: number; isDefault: boolean }) {
  return `You are Energenius, an AI assistant for energy and electrical-system questions inside EnergyPilot. You are friendly and concise.

## What you can do
- Answer questions about the user's live readings, circuits, voltage, power draw, active alerts and 7-day usage, using ONLY the system state block below
- Explain alerts and general ways to address them
- Propose switching one circuit on or off (propose_relay_switch). The user confirms in the app; you never switch anything yourself
- Fetch current weather and relate it to energy use (get_weather)
- Give general energy-saving advice

## What you cannot do
- You have no forecast data, no billing data and no data beyond the system state block. Say so if asked.
- You cannot switch all circuits at once, set thresholds, or change settings.
- You are not an electrician; for wiring faults or safety concerns, tell the user to contact a qualified electrician.

## Rules
- Never make up readings. If a value is not in the system state block, say it is not available.
- When an answer uses the user's data, say so ("Your hub shows…"). When it is general knowledge, say that ("In general…").
- Power (W) values are estimates: measured current × measured voltage × an assumed 0.85 power factor.
- Cost uses ₦${tariff.tariffPerKwh}/kWh${tariff.isDefault ? " (app default — the user has not configured a tariff)" : " (the user's configured tariff)"}.
- Keep responses short; use bullet points for lists.
- Outside energy/electricity/this system: politely say it is out of scope.`;
}

// Strip Markdown formatting so plain text reaches the client.
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "")           // headings
    .replace(/\*\*(.+?)\*\*/g, "$1")     // bold
    .replace(/\*(.+?)\*/g, "$1")         // italic
    .replace(/`(.+?)`/g, "$1")           // inline code
    .replace(/^[\*\-]\s+/gm, "• ")      // bullet points → •
    .replace(/\n{3,}/g, "\n\n")          // collapse excess blank lines
    .trim();
}

type CircuitState = {
  channelIndex: number; name: string; currentAmps: number; powerW: number; hasReading: boolean;
};

export function buildContextBlock(
  hubState: { isOnline: boolean; voltage: number; totalPowerW: number; lastUpdated: number } | null,
  circuits: CircuitState[],
  relayStates: { relayNum: number; state: boolean }[],
  anomalies: { severity: string; message: string }[],
  history7d: { date: string; totalKwh: number; peakW: number; costNgn: number }[]
): string {
  if (!hubState) return "No live hub data available.";
  const relay = new Map(relayStates.map((r) => [r.relayNum, r.state]));
  const lines = [
    `Hub: ${hubState.isOnline ? "ONLINE" : "OFFLINE (data may be stale)"}, last update ${new Date(hubState.lastUpdated).toISOString()}`,
    `Whole system: ${hubState.voltage.toFixed(1)} V, ${(hubState.totalPowerW / 1000).toFixed(2)} kW (estimated)`,
    "",
    "Circuits (CH = channel number):",
    ...circuits.map((c) => {
      const r = relay.get(c.channelIndex);
      const relayText = r === undefined ? "relay state unknown" : r ? "relay ON" : "relay OFF";
      const reading = c.hasReading ? `${c.currentAmps.toFixed(2)} A / ~${c.powerW.toFixed(0)} W` : "no reading";
      return `  CH${c.channelIndex + 1} "${c.name}" — ${reading}, ${relayText}`;
    }),
  ];
  if (anomalies.length > 0) {
    lines.push("", "Active alerts:");
    for (const a of anomalies) lines.push(`  • [${a.severity.toUpperCase()}] ${a.message}`);
  } else {
    lines.push("", "Active alerts: none");
  }
  if (history7d.length > 0) {
    lines.push("", "Daily energy, last 7 days (WAT calendar days):");
    for (const day of history7d) {
      lines.push(`  ${day.date}: ${day.totalKwh.toFixed(2)} kWh, peak ${(day.peakW / 1000).toFixed(2)} kW, ₦${Math.round(day.costNgn).toLocaleString()}`);
    }
  }
  return lines.join("\n");
}

// ── Internal: everything an AI action needs, checked against the caller's access ──
export const prepare = internalQuery({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const access = await getHubReadAccess(ctx, args.hubId);
    if (!access) return null;
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", access.user._id))
      .unique();
    const facility = await ctx.db.get(access.hub.facilityId);
    return {
      userId: access.user._id,
      role:   access.role,
      geminiApiKey: prefs?.geminiApiKey ?? null,
      tariff: facility?.tariffPerKwh
        ? { tariffPerKwh: facility.tariffPerKwh, isDefault: false }
        : { tariffPerKwh: DEFAULT_TARIFF_NGN, isDefault: true },
    };
  },
});

// Minimal shapes of the Gemini REST responses we read.
type GeminiPart = { text?: string; functionCall?: { name: string; args?: Record<string, unknown> } };
type GeminiResponse = { candidates?: { content?: { parts?: GeminiPart[] } }[] };
type WttrResponse = { current_condition?: { temp_C: string; FeelsLikeC: string; humidity: string; weatherDesc?: { value: string }[] }[] };

async function gatherContext(ctx: Pick<ActionCtx, "runQuery">, hubId: Id<"hubs">) {
  const now = Math.floor(Date.now() / 1000);
  const [hubState, circuits, relayStates, anomalies, history7d] = await Promise.all([
    ctx.runQuery(api.telemetry.getHubState, { hubId }),
    ctx.runQuery(api.telemetry.getCircuitStates, { hubId }),
    ctx.runQuery(api.relay.getRelayStates, { hubId }),
    ctx.runQuery(api.anomalies.getAnomalies, { hubId, includeResolved: false, limit: 10 }),
    ctx.runQuery(api.telemetry.getConsumptionByDay, { hubId, fromTimestamp: now - 7 * 86400, toTimestamp: now }),
  ]);
  return { circuits: circuits as CircuitState[], block: buildContextBlock(hubState, circuits, relayStates, anomalies, history7d) };
}

// ── Internal mutation: save a message (only the server writes chat history) ──
export const saveMessage = internalMutation({
  args: {
    hubId:   v.id("hubs"),
    role:    v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    relayAction: v.optional(v.object({
      relayNum:    v.number(),
      state:       v.boolean(),
      circuitName: v.string(),
      status:      v.optional(v.union(v.literal("proposed"), v.literal("confirmed"), v.literal("cancelled"))),
    })),
  },
  handler: async (ctx, args) => {
    const access = await getHubReadAccess(ctx, args.hubId);
    if (!access) throw new ConvexError("Access denied");
    if (args.content.length > 4000) throw new ConvexError("Message too long");
    const user = access.user;
    const now = Date.now();
    await ctx.db.insert("aiMessages", {
      userId:      user._id,
      hubId:       args.hubId,
      role:        args.role,
      content:     args.content,
      relayAction: args.relayAction,
      timestamp:   now,
      ttl:         now + TTL_MS,
    });
    // Evict oldest messages beyond MAX_HISTORY
    const all = await ctx.db
      .query("aiMessages")
      .withIndex("by_user_hub_time", (q) =>
        q.eq("userId", user._id).eq("hubId", args.hubId)
      )
      .order("asc")
      .take(MAX_HISTORY + 10);
    if (all.length > MAX_HISTORY) {
      for (const msg of all.slice(0, all.length - MAX_HISTORY)) {
        await ctx.db.delete(msg._id);
      }
    }
  },
});

// ── Query: get message history ─────────────────────────────────────────────
export const getMessages = query({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args) => {
    const access = await getHubReadAccess(ctx, args.hubId);
    if (!access) return [];
    return await ctx.db
      .query("aiMessages")
      .withIndex("by_user_hub_time", (q) =>
        q.eq("userId", access.user._id).eq("hubId", args.hubId)
      )
      .order("asc")
      .take(MAX_HISTORY + 10);
  },
});

// ── Mutation: confirm or cancel an AI relay proposal ──────────────────────
// Confirm runs the normal relay command with the caller's own permissions.
export const resolveRelayProposal = mutation({
  args: { messageId: v.id("aiMessages"), confirm: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const msg = await ctx.db.get(args.messageId);
    if (!msg || msg.userId !== user._id || msg.relayAction?.status !== "proposed") {
      throw new ConvexError("This proposal is no longer pending");
    }
    const action = msg.relayAction;
    if (args.confirm) {
      if (Date.now() - msg.timestamp > PROPOSAL_TTL_MS) {
        await ctx.db.patch(msg._id, { relayAction: { ...action, status: "cancelled" } });
        throw new ConvexError("This proposal expired — ask again to get a fresh one");
      }
      await ctx.runMutation(api.relay.sendCommand, { hubId: msg.hubId, relayNum: action.relayNum, state: action.state });
    }
    await ctx.db.patch(msg._id, { relayAction: { ...action, status: args.confirm ? "confirmed" : "cancelled" } });
  },
});

async function callGemini(apiKey: string, body: unknown): Promise<Response> {
  let res: Response | null = null;
  for (const model of TEXT_MODELS) {
    res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    });
    if (res.ok || (res.status !== 404 && res.status !== 503)) break;
  }
  return res!;
}

// ── Action: send a message and get a Gemini response ──────────────────────
// Flow: check access → save user message → build context → call Gemini
//       → (proposal or weather follow-up) → save assistant message → return reply
export const sendMessage = action({
  args: {
    hubId:   v.id("hubs"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<{ reply: string; relayAction?: { relayNum: number; state: boolean; circuitName: string; status?: "proposed" | "confirmed" | "cancelled" } }> => {
    const prep = await ctx.runQuery(internal.ai.prepare, { hubId: args.hubId });
    if (!prep) throw new ConvexError("Hub not found or access denied");
    if (!prep.geminiApiKey) throw new ConvexError("No Gemini API key configured — add one in Settings → API Access");

    await ctx.runMutation(internal.ai.saveMessage, { hubId: args.hubId, role: "user", content: args.content });

    const [{ circuits, block }, history] = await Promise.all([
      gatherContext(ctx, args.hubId),
      ctx.runQuery(api.ai.getMessages, { hubId: args.hubId }),
    ]);
    const recentHistory = (history as { role: string; content: string }[]).slice(-10);

    const geminiMessages = [
      { role: "user", parts: [{ text: `${systemPrompt(prep.tariff)}\n\nCurrent system state:\n${block}` }] },
      { role: "model", parts: [{ text: "Understood. I have the current system state. How can I help?" }] },
      ...recentHistory.slice(0, -1).map((m) => ({
        role:  m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: args.content }] },
    ];
    const generationConfig = { temperature: 0.4, maxOutputTokens: 512 };

    const res = await callGemini(prep.geminiApiKey, {
      contents: geminiMessages,
      tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
      generationConfig,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new ConvexError(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
    if (parts.length === 0) throw new ConvexError("No response from Gemini");

    const fnCall = parts.find((p) => p.functionCall)?.functionCall;

    if (fnCall?.name === "propose_relay_switch") {
      const channel = Number(fnCall.args?.channel);
      const state = fnCall.args?.state === true;
      const circuit = circuits.find((c) => c.channelIndex + 1 === channel);
      let reply: string;
      let relayAction;
      if (!circuit) {
        reply = `I couldn't find CH${Number.isFinite(channel) ? channel : "?"} on this hub. Which circuit do you mean?`;
      } else if (prep.role === "viewer") {
        reply = `You have view-only access, so you can't switch CH${channel} "${circuit.name}". Ask the hub owner.`;
      } else {
        // Name comes from the database, never from the model.
        relayAction = { relayNum: circuit.channelIndex, state, circuitName: `CH${channel} · ${circuit.name}`, status: "proposed" as const };
        reply = `I can turn ${state ? "ON" : "OFF"} CH${channel} "${circuit.name}". Tap Confirm to switch it, or Cancel.`;
      }
      await ctx.runMutation(internal.ai.saveMessage, { hubId: args.hubId, role: "assistant", content: reply, relayAction });
      return { reply, relayAction };
    }

    if (fnCall?.name === "get_weather") {
      const city = (fnCall.args?.city as string) || "Lagos";
      let weatherText = "Weather data unavailable.";
      try {
        const wttr = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { headers: { Accept: "application/json" } });
        if (wttr.ok) {
          const cur = ((await wttr.json()) as WttrResponse).current_condition?.[0];
          if (cur) {
            weatherText = `${city}: ${cur.temp_C}°C (feels ${cur.FeelsLikeC}°C), ${cur.weatherDesc?.[0]?.value ?? "unknown"}, humidity ${cur.humidity}%`;
          }
        }
      } catch { /* network error → "unavailable" */ }

      const res2 = await callGemini(prep.geminiApiKey, {
        contents: [
          ...geminiMessages,
          { role: "model", parts: [{ functionCall: { name: "get_weather", args: fnCall.args } }] },
          { role: "user",  parts: [{ functionResponse: { name: "get_weather", response: { content: weatherText } } }] },
        ],
        generationConfig,
      });
      const data2 = (res2.ok ? await res2.json() : {}) as GeminiResponse;
      const reply = stripMarkdown(
        data2.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? weatherText
      );
      await ctx.runMutation(internal.ai.saveMessage, { hubId: args.hubId, role: "assistant", content: reply });
      return { reply };
    }

    const reply = stripMarkdown(parts.find((p) => p.text)?.text?.trim() ?? "I couldn't generate a response.");
    await ctx.runMutation(internal.ai.saveMessage, { hubId: args.hubId, role: "assistant", content: reply });
    return { reply };
  },
});

// ── Action: short-lived Gemini Live token for the mobile voice mode ────────
// The phone never receives the user's API key. The token allows one session,
// must be used within 1 minute, expires after 30 minutes, and is locked to one
// model and to a server-built system instruction (with the current system snapshot).
// Live mode has no tools: it cannot propose or perform relay switches.
export const createLiveToken = action({
  args: { hubId: v.id("hubs") },
  handler: async (ctx, args): Promise<{ token: string; model: string; expiresAt: number }> => {
    const prep = await ctx.runQuery(internal.ai.prepare, { hubId: args.hubId });
    if (!prep) throw new ConvexError("Hub not found or access denied");
    if (!prep.geminiApiKey) throw new ConvexError("No Gemini API key configured — add one in Settings → API Access");

    const { block } = await gatherContext(ctx, args.hubId);
    const instruction =
      `${systemPrompt(prep.tariff)}\n\nThis is a spoken conversation: answer in one or two short sentences. ` +
      `You cannot switch circuits in voice mode; tell the user to use the Circuits screen or text chat.\n\n` +
      `System state at the start of this voice session (it is not updated during the session):\n${block}`;

    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;
    const res = await fetch(`${GEMINI_API_BASE}/auth_tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": prep.geminiApiKey },
      body: JSON.stringify({
        uses: 1,
        expireTime: new Date(expiresAt).toISOString(),
        newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
        // Token's setup wins over anything the client sends (empty fieldMask).
        bidiGenerateContentSetup: {
          model: LIVE_MODEL,
          generationConfig: { responseModalities: ["TEXT"] },
          systemInstruction: { parts: [{ text: instruction }] },
        },
      }),
    });
    if (!res.ok) {
      throw new ConvexError(`Could not start a voice session (Gemini ${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as { name?: unknown };
    if (typeof data.name !== "string") throw new ConvexError("Gemini returned no session token");
    return { token: data.name, model: LIVE_MODEL, expiresAt };
  },
});
