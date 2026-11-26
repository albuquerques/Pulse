import { db, getDeviceId } from "./db.ts";
import { localDate, type StoredEvent } from "./score.ts";

/**
 * The only way an event enters the log. Writing the event and queueing it for
 * the server happen in one transaction, so an event is never left unsent nor
 * sent without being stored. Events are append-only (architecture rule 1).
 */
export async function recordEvent(
  type: "task_completed" | "task_uncompleted",
  taskId: string,
): Promise<StoredEvent> {
  const now = new Date();
  const event: StoredEvent = {
    id: crypto.randomUUID(),
    device_id: await getDeviceId(),
    type,
    payload: { taskId },
    local_date: localDate(now),
    client_ts: now.toISOString(),
  };

  await db.transaction("rw", db.events, db.outbox, async () => {
    await db.events.add(event);
    await db.outbox.add({ id: event.id });
  });

  return event;
}

/** Events the server sent us, kept only if we do not know the id yet. */
export async function ingestRemote(events: readonly StoredEvent[]): Promise<number> {
  if (events.length === 0) return 0;
  let added = 0;
  await db.transaction("rw", db.events, async () => {
    const known = new Set(
      await db.events
        .where("id")
        .anyOf(events.map((e) => e.id))
        .primaryKeys(),
    );
    const fresh = events.filter((e) => !known.has(e.id));
    if (fresh.length > 0) {
      await db.events.bulkAdd(fresh);
      added = fresh.length;
    }
  });
  return added;
}
