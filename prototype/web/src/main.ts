import { liveQuery } from "dexie";
import { db, getDeviceId, getLastSeq } from "./db.ts";
import { recordEvent } from "./events.ts";
import { completedTaskIds, formatScore, localDate, score, type StoredEvent } from "./score.ts";
import { getSyncState, onSyncChange, startSync, syncNow } from "./sync.ts";
import { TASKS } from "./tasks.ts";

const scoreEl = query("score");
const tasksEl = query("tasks");
const eventCountEl = query("event-count");
const outboxEl = query("outbox-size");
const lastSeqEl = query("last-seq");
const syncStateEl = query("sync-state");
const deviceIdEl = query("device-id");

function query(testId: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  if (el === null) throw new Error(`missing [data-testid="${testId}"]`);
  return el;
}

const buttons = new Map<string, HTMLButtonElement>();
const states = new Map<string, HTMLElement>();

for (const task of TASKS) {
  const row = document.createElement("li");

  const name = document.createElement("span");
  name.className = "name";
  name.textContent = `${task.name} · peso ${task.weight}`;

  const state = document.createElement("span");
  state.dataset.testid = `task-${task.id}-state`;
  state.textContent = "pendente";

  const button = document.createElement("button");
  button.dataset.testid = `task-${task.id}`;
  button.type = "button";
  button.textContent = "Concluir";
  button.addEventListener("click", () => void toggle(task.id));

  row.append(name, state, button);
  tasksEl.append(row);
  buttons.set(task.id, button);
  states.set(task.id, state);
}

/** One tap flips the task for today by appending the opposite event. */
async function toggle(taskId: string): Promise<void> {
  const today = localDate(new Date());
  const events = await db.events.toArray();
  const isDone = completedTaskIds(events, today).has(taskId);
  // The screen repaints from the local log via liveQuery; the network catches up later.
  await recordEvent(isDone ? "task_uncompleted" : "task_completed", taskId);
  void syncNow();
}

type View = { events: StoredEvent[]; outbox: number; lastSeq: number };

function render(view: View): void {
  const today = localDate(new Date());
  const done = completedTaskIds(view.events, today);

  scoreEl.textContent = formatScore(score(view.events, today, TASKS));
  for (const task of TASKS) {
    const isDone = done.has(task.id);
    states.get(task.id)!.textContent = isDone ? "concluída" : "pendente";
    const button = buttons.get(task.id)!;
    button.textContent = isDone ? "Desfazer" : "Concluir";
    button.setAttribute("aria-label", `${isDone ? "Desfazer" : "Concluir"} ${task.name}`);
  }

  scoreEl.setAttribute("aria-label", `Nota do dia: ${scoreEl.textContent}`);
  eventCountEl.textContent = String(view.events.length);
  outboxEl.textContent = String(view.outbox);
  lastSeqEl.textContent = String(view.lastSeq);
  syncStateEl.textContent = getSyncState();
}

deviceIdEl.textContent = await getDeviceId();

/**
 * Everything on screen is a projection of the local log. liveQuery re-runs on any
 * write to these tables, so events arriving from a pull repaint the page too.
 */
let latest: View = { events: [], outbox: 0, lastSeq: 0 };
liveQuery<View>(async () => ({
  events: await db.events.toArray(),
  outbox: await db.outbox.count(),
  lastSeq: await getLastSeq(),
})).subscribe((view) => {
  latest = view;
  render(view);
});

onSyncChange(() => render(latest));
startSync();
