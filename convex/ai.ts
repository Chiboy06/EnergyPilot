// convex/ai.ts
// Gemini-powered AI assistant with relay function calling.
// All Gemini API calls happen in Actions (never mutations).
// Relay commands are forwarded to relay.sendCommand (internal mutation).

import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

const GEMINI_API_BASE  = "https://generativelanguage.googleapis.com/v1beta";
// Primary text model; falls back to gemini-2.5-flash if 404/503
const TEXT_MODELS      = ["gemini-3.5-flash", "gemini-2.5-flash"];
const MAX_HISTORY      = 20;
const TTL_MS           = 7 * 24 * 60 * 60 * 1000;

// ── Function declarations for Gemini function-calling ─────────────────────
const FUNCTION_DECLARATIONS = [
  {
    name: "control_relay",
    description:
      "Turn a circuit relay ON or OFF. Use only when the user explicitly asks to turn on or off a specific circuit, appliance, or room.",
    parameters: {
      type: "OBJECT",
      properties: {
        relay_num:    { type: "INTEGER", description: "0-based relay index as shown in the circuit list" },
        state:        { type: "BOOLEAN", description: "true = ON, false = OFF" },
        circuit_name: { type: "STRING",  description: "Human-readable name of the circuit being controlled" },
      },
      required: ["relay_num", "state", "circuit_name"],
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

const CONTACT_INFO = `Contact & support: email support@energypilot.app · website energypilot.app/contact`;

const SYSTEM_PROMPT = `You are Energenius, an intelligent AI energy management assistant built into the EnergyPilot smart energy OS. You are friendly, concise, and deeply knowledgeable about electricity, energy management, and the Nigerian power grid.

## What you can do
- Answer questions about the user's real-time energy usage, circuits, voltage, and power draw
- Explain active anomalies, their causes and how to resolve them
- Discuss 24-hour load forecasts and what they mean for cost and comfort
- Analyse energy patterns — peak hours, inefficient devices, tariff impact
- Control circuits by turning relays on or off (use control_relay function)
- Fetch the current weather and explain its impact on energy use (use get_weather function)
- Provide energy-saving tips tailored to the user's actual consumption data

## Weather + energy analysis
When a user asks about weather or you think weather context is relevant, call get_weather. Always frame weather info in energy terms — hot weather → higher AC load, cloudy → no solar benefit, etc.

## Topics outside energy scope
For general knowledge not related to energy, electricity, or this system, politely suggest the user searches online. Do NOT make up facts.

## Contact
If the user needs human support: ${CONTACT_INFO}

## Rules
- Never make up sensor values — only use the context provided in the system state block
- Keep responses short and scannable — use bullet points for lists
- When controlling a relay, always confirm the action: "Turning on Kitchen AC."
- Tariff default: ₦225/kWh (Nigerian DisCo band A rate) unless the user has configured their own`;

// Strip Markdown formatting so plain text reaches the client.
// Gemini returns **bold**, * bullets, ### headings — none of which render
// correctly in a plain <p> tag.
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

// ── Helpers ────────────────────────────────────────────────────────────────

async function resolveUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new ConvexError("User not found");
  return user;
}

function buildContextBlock(
  hubState: any,
  circuits: any[],
  anomalies: any[],
  history7d: any[]
): string {
  if (!hubState) return "No live hub data available.";
  const lines = [
    `Hub: ${hubState.isOnline ? "ONLINE" : "OFFLINE"}, Voltage: ${hubState.voltage.toFixed(1)}V, Total: ${(hubState.totalPowerW / 1000).toFixed(2)} kW`,
    "",
    "Circuits:",
    ...circuits.map(
      (c, i) =>
        `  [${i}] ${c.name} — ${c.currentAmps?.toFixed(2) ?? "0.00"}A / ${c.powerW?.toFixed(0) ?? "0"}W${c.isActive ? "" : " (OFF)"}`
    ),
  ];
  if (anomalies.length > 0) {
    lines.push("", "Active anomalies:");
    for (const a of anomalies) {
      lines.push(`  • [${a.severity.toUpperCase()}] ${a.message}`);
    }
  }
  if (history7d.length > 0) {
    lines.push("", "7-day consumption history:");
    for (const day of history7d) {
      const cost = day.costNgn != null ? ` · ₦${Math.round(day.costNgn).toLocaleString()}` : "";
      lines.push(`  ${day.date}: ${day.totalKwh.toFixed(2)} kWh, peak ${(day.peakW / 1000).toFixed(2)} kW${cost}`);
    }
  }
  return lines.join("\n");
}

// ── Mutation: save a message ───────────────────────────────────────────────
export const saveMessage = mutation({
  args: {
    hubId:   v.id("hubs"),
    role:    v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    relayAction: v.optional(v.object({
      relayNum:    v.number(),
      state:       v.boolean(),
      circuitName: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx);
    const hub  = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) throw new ConvexError("Access denied");
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
      .withIndex("by_user_hub_time", (q: any) =>
        q.eq("userId", user._id).eq("hubId", args.hubId)
      )
      .order("asc")
      .collect();
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];
    const hub = await ctx.db.get(args.hubId);
    if (!hub || hub.userId !== user._id) return [];
    return await ctx.db
      .query("aiMessages")
      .withIndex("by_user_hub_time", (q: any) =>
        q.eq("userId", user._id).eq("hubId", args.hubId)
      )
      .order("asc")
      .collect();
  },
});

// ── Action: send a message and get a Gemini response ──────────────────────
// This is the main entry point called by the frontend.
// Flow: save user message → build context → call Gemini → handle function call
//       → save assistant message → return reply
export const sendMessage = action({
  args: {
    hubId:   v.id("hubs"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<{ reply: string; relayAction?: { relayNum: number; state: boolean; circuitName: string } }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    // Resolve user
    const user: any = await ctx.runQuery(api.users.getCurrentUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) throw new ConvexError("User not found");

    // Verify hub ownership via getHubState (returns null if not owner)
    const hubStateCheck: any = await ctx.runQuery(api.telemetry.getHubState, {
      hubId: args.hubId,
    });
    if (hubStateCheck === null) throw new ConvexError("Hub not found or access denied");

    // Get Gemini API key from user preferences
    const prefs: any = await ctx.runQuery(api.preferences.get, {});
    if (!prefs?.geminiApiKey) throw new ConvexError("No Gemini API key configured");

    // Save user message
    await ctx.runMutation(api.ai.saveMessage, {
      hubId:   args.hubId,
      role:    "user",
      content: args.content,
    });

    // Gather live context
    const now7d = Math.floor(Date.now() / 1000);
    const [hubState, circuits, anomalies, history7d, history] = await Promise.all([
      ctx.runQuery(api.telemetry.getHubState, { hubId: args.hubId }),
      ctx.runQuery(api.telemetry.getCircuitStates, { hubId: args.hubId }),
      ctx.runQuery(api.anomalies.getAnomalies, { hubId: args.hubId, includeResolved: false, limit: 10 }),
      ctx.runQuery(api.telemetry.getConsumptionByDay, {
        hubId: args.hubId,
        fromTimestamp: now7d - 7 * 24 * 60 * 60,
        toTimestamp: now7d,
      }),
      ctx.runQuery(api.ai.getMessages, { hubId: args.hubId }),
    ]);
    const recentHistory = (history as any[]).slice(-10);

    const contextBlock = buildContextBlock(hubState, circuits as any[], anomalies as any[], history7d as any[]);

    // Build Gemini request
    const geminiMessages = [
      // First message includes system context
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\nCurrent system state:\n${contextBlock}` }],
      },
      { role: "model", parts: [{ text: "Understood. I have the current system state. How can I help?" }] },
      // Prior conversation
      ...recentHistory.slice(0, -1).map((m: any) => ({
        role:  m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      // Current user message
      { role: "user", parts: [{ text: args.content }] },
    ];

    const requestBody = {
      contents: geminiMessages,
      tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
      generationConfig: {
        temperature:     0.7,
        maxOutputTokens: 512,
      },
    };

    let res: Response | null = null;
    for (const model of TEXT_MODELS) {
      res = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${prefs.geminiApiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
      );
      if (res.ok || (res.status !== 404 && res.status !== 503)) break;
    }
    if (!res!.ok) {
      const errText = await res!.text();
      throw new ConvexError(`Gemini API error ${res!.status}: ${errText.slice(0, 200)}`);
    }

    const data: any = await res!.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new ConvexError("No response from Gemini");

    const parts = candidate.content?.parts ?? [];

    // Check for function call
    const fnCall = parts.find((p: any) => p.functionCall);
    if (fnCall) {
      const { name, args: fnArgs } = fnCall.functionCall;

      if (name === "control_relay") {
        const relayAction = {
          relayNum:    fnArgs.relay_num as number,
          state:       fnArgs.state as boolean,
          circuitName: fnArgs.circuit_name as string,
        };
        await ctx.runMutation(api.relay.sendCommand, {
          hubId:    args.hubId,
          relayNum: relayAction.relayNum,
          state:    relayAction.state,
        });
        const reply = `Turning ${relayAction.state ? "on" : "off"} ${relayAction.circuitName}.`;
        await ctx.runMutation(api.ai.saveMessage, {
          hubId: args.hubId, role: "assistant", content: reply, relayAction,
        });
        return { reply, relayAction };
      }

      if (name === "get_weather") {
        const city = (fnArgs.city as string) || "Lagos";
        let weatherText = "Weather data unavailable.";
        try {
          const wttr = await fetch(
            `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
            { headers: { "Accept": "application/json" } }
          );
          if (wttr.ok) {
            const wj: any = await wttr.json();
            const cur = wj.current_condition?.[0];
            if (cur) {
              const tempC    = cur.temp_C;
              const feelsC   = cur.FeelsLikeC;
              const humidity = cur.humidity;
              const desc     = cur.weatherDesc?.[0]?.value ?? "unknown";
              weatherText = `${city}: ${tempC}°C (feels ${feelsC}°C), ${desc}, humidity ${humidity}%`;
            }
          }
        } catch { /* ignore network errors */ }

        // Feed weather result back into Gemini for a follow-up
        const followUpBody = {
          contents: [
            ...geminiMessages,
            { role: "model", parts: [{ functionCall: { name: "get_weather", args: fnArgs } }] },
            { role: "user",  parts: [{ functionResponse: { name: "get_weather", response: { content: weatherText } } }] },
          ],
          tools: [{ function_declarations: FUNCTION_DECLARATIONS }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        };
        const res2 = await fetch(
          `${GEMINI_API_BASE}/models/${TEXT_MODELS[0]}:generateContent?key=${prefs.geminiApiKey}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(followUpBody) }
        );
        const data2: any = res2.ok ? await res2.json() : {};
        const reply = stripMarkdown(
          data2.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim()
          ?? weatherText
        );
        await ctx.runMutation(api.ai.saveMessage, { hubId: args.hubId, role: "assistant", content: reply });
        return { reply };
      }
    }

    // Normal text response
    const textPart = parts.find((p: any) => p.text);
    const reply = stripMarkdown(textPart?.text?.trim() ?? "I couldn't generate a response.");

    await ctx.runMutation(api.ai.saveMessage, {
      hubId:   args.hubId,
      role:    "assistant",
      content: reply,
    });

    return { reply };
  },
});
