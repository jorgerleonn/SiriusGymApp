#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Tool implementations ──────────────────────────────────────────────

async function getWorkouts(args: { userId?: string; limit?: number; type?: string }) {
  let query = supabase
    .from("workouts")
    .select("*")
    .order("date", { ascending: false })
    .limit(args.limit ?? 10);

  if (args.userId) query = query.eq("user_id", args.userId);
  if (args.type) query = query.eq("type", args.type);

  const { data, error } = await query;
  if (error) throw new McpError(ErrorCode.InternalError, error.message);
  return data ?? [];
}

async function getWorkout(args: { id: string }) {
  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .select("*")
    .eq("id", args.id)
    .single();

  if (wErr) throw new McpError(ErrorCode.InternalError, wErr.message);
  if (!workout) throw new McpError(ErrorCode.InvalidParams, "Workout not found");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*, sets(*)")
    .eq("workout_id", args.id)
    .order("order_index");

  return { ...workout, exercises: exercises ?? [] };
}

async function getStats(args: { userId?: string }) {
  const q = supabase.from("workouts").select("*");

  if (args.userId) q.eq("user_id", args.userId);

  const { data: workouts, error } = await q;
  if (error) throw new McpError(ErrorCode.InternalError, error.message);

  const total = workouts?.length ?? 0;
  const volume = (workouts ?? []).reduce((sum, w) => sum + (w.total_volume ?? 0), 0);
  const cardioDistance = (workouts ?? []).reduce(
    (sum, w) => sum + (w.total_cardio_distance ?? 0),
    0
  );

  return { totalWorkouts: total, totalVolume: volume, totalCardioDistanceKm: cardioDistance };
}

async function getStravaActivities(args: { userId?: string; limit?: number }) {
  let q = supabase
    .from("strava_activities")
    .select("*, workouts!inner(name, date)")
    .order("start_date", { ascending: false })
    .limit(args.limit ?? 20);

  if (args.userId) q = q.eq("user_id", args.userId);

  const { data, error } = await q;
  if (error) throw new McpError(ErrorCode.InternalError, error.message);
  return data ?? [];
}

async function getStravaStatus(args: { userId: string }) {
  const { data, error } = await supabase
    .from("strava_connections")
    .select("strava_athlete_id, created_at, scope")
    .eq("user_id", args.userId)
    .single();

  if (error && error.code === "PGRST116") return { connected: false };
  if (error) throw new McpError(ErrorCode.InternalError, error.message);

  return {
    connected: true,
    athleteId: data.strava_athlete_id,
    connectedSince: data.created_at,
    scope: data.scope,
  };
}

async function getTemplate(args: { templateId?: string; userId?: string }) {
  let q = supabase.from("workout_templates").select("*").order("name");

  if (args.templateId) q = q.eq("id", args.templateId);
  if (args.userId) q = q.eq("user_id", args.userId);

  const { data, error } = await q;
  if (error) throw new McpError(ErrorCode.InternalError, error.message);
  return data ?? [];
}

// ── Handle errors gracefully ──────────────────────────────────────────

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ── Server setup ──────────────────────────────────────────────────────

const server = new Server(
  {
    name: "sirius-mcp",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "sirius_get_workouts",
      description: "List recent workouts. Filter by type (strength/cardio/hybrid) or userId.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Filter by user ID (optional)" },
          limit: { type: "number", description: "Max results (default 10)" },
          type: {
            type: "string",
            enum: ["strength", "cardio", "hybrid"],
            description: "Filter by workout type",
          },
        },
      },
    },
    {
      name: "sirius_get_workout",
      description: "Get full workout details including exercises and sets.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Workout ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "sirius_get_stats",
      description: "Get aggregate statistics (total workouts, volume, cardio distance).",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Filter by user ID (optional)" },
        },
      },
    },
    {
      name: "sirius_get_strava_activities",
      description: "List Strava activities imported into Sirius.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Filter by user ID (optional)" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
    {
      name: "sirius_get_strava_status",
      description: "Check if Strava is connected and get athlete info.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User ID" },
        },
        required: ["userId"],
      },
    },
    {
      name: "sirius_get_templates",
      description: "List workout templates.",
      inputSchema: {
        type: "object",
        properties: {
          templateId: { type: "string", description: "Get specific template by ID" },
          userId: { type: "string", description: "Filter by user ID" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "sirius_get_workouts": {
        const result = await getWorkouts({
          userId: args?.userId as string | undefined,
          limit: args?.limit as number | undefined,
          type: args?.type as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "sirius_get_workout": {
        if (!args?.id) return toolError("id is required");
        const result = await getWorkout({ id: args.id as string });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "sirius_get_stats": {
        const result = await getStats({ userId: args?.userId as string | undefined });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "sirius_get_strava_activities": {
        const result = await getStravaActivities({
          userId: args?.userId as string | undefined,
          limit: args?.limit as number | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "sirius_get_strava_status": {
        if (!args?.userId) return toolError("userId is required");
        const result = await getStravaStatus({ userId: args.userId as string });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "sirius_get_templates": {
        const result = await getTemplate({
          templateId: args?.templateId as string | undefined,
          userId: args?.userId as string | undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof McpError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    return toolError(message);
  }
});

// ── Start ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("sirius-mcp running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
