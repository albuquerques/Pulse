import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { migrate, pool } from "./db.ts";

/**
 * Single hard-coded user. Read on the server, never taken from the request:
 * every query filters by it (CLAUDE.md, architecture rule 5).
 */
const USER_ID = "proto-user";
const PORT = Number(process.env.PORT ?? 8787);
const PULL_LIMIT = 500;

/** An event exactly as the client created it. The id comes from the device. */
type IncomingEvent = {
  id: string;
  device_id: string;
  type: string;
  payload: unknown;
  local_date: string;
  client_ts: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseEvent(raw: unknown): IncomingEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.id !== "string" || !UUID_RE.test(e.id)) return null;
  if (typeof e.device_id !== "string" || e.device_id.length === 0) return null;
  if (typeof e.type !== "string" || e.type.length === 0) return null;
  if (typeof e.local_date !== "string" || !ISO_DATE_RE.test(e.local_date)) return null;
  if (typeof e.client_ts !== "string" || Number.isNaN(Date.parse(e.client_ts))) return null;
  return {
    id: e.id,
    device_id: e.device_id,
    type: e.type,
    payload: e.payload ?? {},
    local_date: e.local_date,
    client_ts: e.client_ts,
  };
}

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

/**
 * Takes a batch of events and keeps the ones it does not have yet. Replaying the
 * same batch is a no-op, and the answer still carries a server_seq for every id
 * sent, so a client that lost our previous answer can clear its outbox.
 */
app.post("/sync/push", async (c) => {
  const body = await c.req.json().catch(() => null);
  const raw = (body as { events?: unknown })?.events;
  if (!Array.isArray(raw)) return c.json({ error: "events must be an array" }, 400);

  const events = raw.map(parseEvent);
  if (events.some((e) => e === null)) return c.json({ error: "malformed event" }, 400);
  const valid = events as IncomingEvent[];
  if (valid.length === 0) return c.json({ accepted: [] });

  const values: unknown[] = [USER_ID];
  const rows = valid.map((e) => {
    const i = values.length;
    values.push(e.id, e.device_id, e.type, JSON.stringify(e.payload), e.local_date, e.client_ts);
    return `($${i + 1}, $1, $${i + 2}, $${i + 3}, $${i + 4}::jsonb, $${i + 5}::date, $${i + 6}::timestamptz)`;
  });

  await pool.query(
    `insert into events (id, user_id, device_id, type, payload, local_date, client_ts)
     values ${rows.join(", ")}
     on conflict (id) do nothing`,
    values,
  );

  // Includes ids that were already there, so a retried batch still resolves.
  const { rows: accepted } = await pool.query<{ id: string; server_seq: string }>(
    `select id, server_seq from events
     where user_id = $1 and id = any($2::uuid[])
     order by server_seq asc`,
    [USER_ID, valid.map((e) => e.id)],
  );

  return c.json({
    accepted: accepted.map((r) => ({ id: r.id, server_seq: Number(r.server_seq) })),
  });
});

/** Everything this user has after the given cursor, oldest server_seq first. */
app.get("/sync/pull", async (c) => {
  const after = Number(c.req.query("after") ?? 0);
  if (!Number.isFinite(after) || after < 0) return c.json({ error: "bad after" }, 400);

  const { rows } = await pool.query<{
    id: string;
    device_id: string;
    type: string;
    payload: unknown;
    local_date: string;
    client_ts: Date;
    server_seq: string;
  }>(
    // local_date::text on purpose: the pg driver would otherwise parse a date
    // column into a JS Date, and JSON would ship it as a full timestamp, which
    // no longer matches the day the client projects by.
    `select id, device_id, type, payload, local_date::text as local_date,
            client_ts, server_seq
     from events
     where user_id = $1 and server_seq > $2
     order by server_seq asc
     limit $3`,
    [USER_ID, after, PULL_LIMIT],
  );

  const events = rows.map((r) => ({
    id: r.id,
    device_id: r.device_id,
    type: r.type,
    payload: r.payload,
    local_date: r.local_date,
    client_ts: r.client_ts.toISOString(),
    server_seq: Number(r.server_seq),
  }));

  // Holding the cursor when the page is empty keeps the client from rewinding.
  const lastSeq = events.length > 0 ? events[events.length - 1]!.server_seq : after;
  return c.json({ events, lastSeq, hasMore: events.length === PULL_LIMIT });
});

// Test-only: the user_id is fixed, so the e2e suite needs a way to start clean.
if (process.env.PROTO_ALLOW_RESET === "1") {
  app.post("/test/reset", async (c) => {
    await pool.query("truncate table events restart identity");
    return c.json({ ok: true });
  });
}

await migrate();
serve({ fetch: app.fetch, port: PORT });
console.log(`proto server on http://localhost:${PORT}`);
