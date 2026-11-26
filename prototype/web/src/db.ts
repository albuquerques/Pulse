import Dexie, { type EntityTable } from "dexie";
import type { StoredEvent } from "./score.ts";

/** An event id still waiting for the server to confirm it. */
export type OutboxRow = { id: string };

/** Single-row-per-key scratch space: deviceId, lastSeq. */
export type MetaRow = { key: string; value: string };

const db = new Dexie("pulse-proto") as Dexie & {
  events: EntityTable<StoredEvent, "id">;
  outbox: EntityTable<OutboxRow, "id">;
  meta: EntityTable<MetaRow, "key">;
};

db.version(1).stores({
  // local_date is indexed because every projection starts by narrowing to a day
  events: "id, local_date, client_ts",
  outbox: "id",
  meta: "key",
});

export { db };

export async function getMeta(key: string): Promise<string | undefined> {
  return (await db.meta.get(key))?.value;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

/** The cursor of the last event we pulled from the server. */
export async function getLastSeq(): Promise<number> {
  return Number((await getMeta("lastSeq")) ?? 0);
}

export async function setLastSeq(seq: number): Promise<void> {
  await setMeta("lastSeq", String(seq));
}

/** Stable per browser profile, so events can be told apart by origin device. */
export async function getDeviceId(): Promise<string> {
  const existing = await getMeta("deviceId");
  if (existing !== undefined) return existing;
  const fresh = `dev-${crypto.randomUUID().slice(0, 8)}`;
  await setMeta("deviceId", fresh);
  return fresh;
}
