// convex/http.ts
// HTTP Action endpoints exposed at https://<deployment>.convex.site/
//
// Clerk webhook endpoint:
//   POST /clerk-webhook
//   Receives user.created / user.updated / user.deleted events from Clerk.
//   Verifies the Svix signature before processing.
//
// IoT ingest endpoint:
//   POST /iot-ingest
//   Receives telemetry from the Lambda function (DynamoDB Streams → Lambda → here).
//   Protected by a shared secret (IOT_INGEST_SECRET env var).
//
// Environment variables required (set in Convex dashboard → Settings → Environment):
//   CLERK_WEBHOOK_SECRET   — from Clerk Dashboard → Webhooks → your endpoint → Signing Secret
//   IOT_INGEST_SECRET      — a strong random string you generate; must match Lambda env var

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

const http = httpRouter();

// ── Clerk webhook ─────────────────────────────────────────────────────────
http.route({
  path:   "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("CLERK_WEBHOOK_SECRET not set", { status: 500 });
    }

    // Verify Svix signature
    const svix_id        = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    const payload = await request.text();
    const wh      = new Webhook(webhookSecret);

    let event: WebhookEvent;
    try {
      event = wh.verify(payload, {
        "svix-id":        svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch {
      return new Response("Invalid signature", { status: 401 });
    }

    // Route event types
    if (event.type === "user.created" || event.type === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === event.data.primary_email_address_id
      );

      await ctx.runMutation(internal.users.upsert, {
        clerkId:   id,
        email:     primaryEmail?.email_address ?? "",
        firstName: first_name ?? undefined,
        lastName:  last_name  ?? undefined,
        imageUrl:  image_url  ?? undefined,
      });
    }

    if (event.type === "user.deleted" && event.data.id) {
      await ctx.runMutation(internal.users.deleteByClerkId, {
        clerkId: event.data.id,
      });
    }

    return new Response(null, { status: 200 });
  }),
});

// ── IoT telemetry ingest ───────────────────────────────────────────────────
// Receives POST requests from Lambda with telemetry batches.
// Body shape (sent by Lambda):
// {
//   "macAddress": "EC:E3:34:66:98:3C",
//   "voltage": 220.4,
//   "totalCurrent": 12.3,
//   "timestamp": 1749384000,
//   "channels": [0.8, 1.2, 0.0, ...]   // length = hub.channelCount
// }
http.route({
  path:   "/iot-ingest",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify shared secret
    const secret = process.env.IOT_INGEST_SECRET;
    if (!secret) {
      return new Response("IOT_INGEST_SECRET not set", { status: 500 });
    }

    const authHeader = request.headers.get("x-ingest-secret");
    if (authHeader !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }

    let body: {
      macAddress:    string;
      voltage:       number;
      totalCurrent:  number;
      timestamp:     number;
      channels:      number[];
    };

    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    // Validate required fields
    if (
      !body.macAddress ||
      typeof body.voltage      !== "number" ||
      typeof body.totalCurrent !== "number" ||
      typeof body.timestamp    !== "number" ||
      !Array.isArray(body.channels)
    ) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Dispatch to internal mutation (runs transactionally in Convex)
    await ctx.runMutation(internal.telemetry.ingest, {
      macAddress:   body.macAddress,
      voltage:      body.voltage,
      totalCurrent: body.totalCurrent,
      timestamp:    body.timestamp,
      channels:     body.channels,
    });

    return new Response(null, { status: 200 });
  }),
});

// ── Relay command callback (firmware → Convex) ───────────────────────────
// Receives relay state changes from physical button presses on the device.
http.route({
  path:   "/relay-command-callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.IOT_INGEST_SECRET;
    if (request.headers.get("x-ingest-secret") !== secret) {
      return new Response("Unauthorized", { status: 401 });
    }
    let body: { hubMac: string; relayNum: number; state: boolean };
    try { body = await request.json(); } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    const hub = await ctx.runQuery(internal.relay.getHubByMac,
      { macAddress: body.hubMac });
    if (!hub) return new Response("Hub not found", { status: 404 });
    await ctx.runMutation(internal.relay.syncFromFirmware, {
      hubId:    hub._id,
      relayNum: body.relayNum,
      state:    body.state,
    });
    return new Response(null, { status: 200 });
  }),
});

export default http;