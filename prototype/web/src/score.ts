/**
 * Pure projection layer: no imports, no DOM, no Dexie, no network. The real one
 * lands in packages/core (T3/T5); this is the throwaway rehearsal of it.
 */

export type StoredEvent = {
  id: string;
  device_id: string;
  type: string;
  payload: { taskId?: string };
  local_date: string;
  client_ts: string;
};

export type Weighted = { id: string; weight: number };

/**
 * The day an action belongs to, with a configurable cutoff (default 04:00):
 * anything before it still counts for the previous day.
 */
export function localDate(now: Date, cutoffHour = 4): string {
  const shifted = new Date(now.getTime() - cutoffHour * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, "0");
  const d = String(shifted.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Deterministic order: client_ts first, id as the tie-break (decision D4). The
 * same log in any arrival order yields the same projection.
 */
export function compareEvents(a: StoredEvent, b: StoredEvent): number {
  if (a.client_ts !== b.client_ts) return a.client_ts < b.client_ts ? -1 : 1;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return 0;
}

/** The winning event per task for one day: the last one in deterministic order. */
export function lastPerTask(
  events: readonly StoredEvent[],
  date: string,
): Map<string, StoredEvent> {
  const winners = new Map<string, StoredEvent>();
  for (const e of events) {
    if (e.local_date !== date) continue;
    if (e.type !== "task_completed" && e.type !== "task_uncompleted") continue;
    const taskId = e.payload?.taskId;
    if (typeof taskId !== "string") continue;
    const current = winners.get(taskId);
    if (current === undefined || compareEvents(current, e) < 0) winners.set(taskId, e);
  }
  return winners;
}

/** Task ids completed on the given day. */
export function completedTaskIds(
  events: readonly StoredEvent[],
  date: string,
): Set<string> {
  const done = new Set<string>();
  for (const [taskId, e] of lastPerTask(events, date)) {
    if (e.type === "task_completed") done.add(taskId);
  }
  return done;
}

/**
 * Provisional formula (RF08): completed weight / total weight * 10, one decimal,
 * rounded half up. Done in integer arithmetic so the result never depends on
 * floating-point drift.
 */
export function score(
  events: readonly StoredEvent[],
  date: string,
  tasks: readonly Weighted[],
): number {
  const total = tasks.reduce((sum, t) => sum + t.weight, 0);
  if (total === 0) return 0;
  const done = completedTaskIds(events, date);
  const completed = tasks.reduce((sum, t) => (done.has(t.id) ? sum + t.weight : sum), 0);
  return Math.floor((completed * 100) / total + 0.5) / 10;
}

/** "7,8" — pt-BR, always one decimal. */
export function formatScore(value: number): string {
  return value.toFixed(1).replace(".", ",");
}
