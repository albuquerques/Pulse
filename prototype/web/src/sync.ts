import { db, getLastSeq, setLastSeq } from "./db.ts";
import { ingestRemote } from "./events.ts";
import type { StoredEvent } from "./score.ts";

const PUSH_BATCH = 200;
const POLL_MS = 2000;

export type SyncState = "idle" | "syncing" | "offline";

type Listener = () => void;

let state: SyncState = "idle";
let running = false;
let rerun = false;
const listeners = new Set<Listener>();

export function getSyncState(): SyncState {
  return state;
}

export function onSyncChange(listener: Listener): void {
  listeners.add(listener);
}

function setState(next: SyncState): void {
  if (state === next) return;
  state = next;
  for (const listener of listeners) listener();
}

/** Sends whatever is queued, then clears the ids the server acknowledged. */
async function push(): Promise<void> {
  const pending = await db.outbox.limit(PUSH_BATCH).toArray();
  if (pending.length === 0) return;

  const events = await db.events.bulkGet(pending.map((row) => row.id));
  const batch = events.filter((e): e is StoredEvent => e !== undefined);
  if (batch.length === 0) return;

  const response = await fetch("/sync/push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ events: batch }),
  });
  if (!response.ok) throw new Error(`push failed: ${response.status}`);

  const { accepted } = (await response.json()) as {
    accepted: { id: string; server_seq: number }[];
  };
  // Ids already on the server come back too, so a replayed batch still drains.
  await db.outbox.bulkDelete(accepted.map((a) => a.id));
}

/** Pulls everything after our cursor, looping while the server has more. */
async function pull(): Promise<number> {
  let added = 0;
  for (;;) {
    const after = await getLastSeq();
    const response = await fetch(`/sync/pull?after=${after}`);
    if (!response.ok) throw new Error(`pull failed: ${response.status}`);

    const { events, lastSeq, hasMore } = (await response.json()) as {
      events: StoredEvent[];
      lastSeq: number;
      hasMore: boolean;
    };

    added += await ingestRemote(events);
    // Advance only forwards: a stale answer must not rewind the cursor.
    if (lastSeq > after) await setLastSeq(lastSeq);
    if (!hasMore || events.length === 0) return added;
  }
}

/**
 * One push-then-pull cycle. Re-entrant calls do not run in parallel — they mark
 * the cycle to run again, so overlapping triggers never send a batch twice.
 */
export async function syncNow(): Promise<void> {
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  try {
    do {
      rerun = false;
      setState("syncing");
      try {
        await push();
        await pull();
        setState("idle");
      } catch {
        // Offline, or the API is unreachable: the outbox keeps the work for later.
        setState("offline");
        return;
      }
    } while (rerun);
  } finally {
    running = false;
  }
}

/** Sync on reconnect and every 2 s; recordEvent triggers a cycle of its own. */
export function startSync(): void {
  void syncNow();
  addEventListener("online", () => void syncNow());
  setInterval(() => void syncNow(), POLL_MS);
}
