import assert from "node:assert/strict";
import test from "node:test";
import { compareEvents, formatScore, localDate, score, type StoredEvent } from "./score.ts";
import { TASKS } from "./tasks.ts";

const DAY = "2026-11-25";

function event(partial: Partial<StoredEvent> & { id: string; type: string }): StoredEvent {
  return {
    device_id: "dev-a",
    payload: {},
    local_date: DAY,
    client_ts: "2026-11-25T10:00:00.000Z",
    ...partial,
  };
}

function completion(id: string, taskId: string, ts: string, type = "task_completed"): StoredEvent {
  return event({ id, type, payload: { taskId }, client_ts: ts });
}

/** Deterministic shuffle, so a failure reproduces exactly. */
function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  let state = seed;
  for (let i = out.length - 1; i > 0; i--) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

test("score is the completed weight over the total, one decimal, half up", () => {
  // weights are 3, 2, 2, 1, 1 -> total 9
  assert.equal(score([], DAY, TASKS), 0);
  assert.equal(score([completion("a", "deep-work", "2026-11-25T10:00:00.000Z")], DAY, TASKS), 3.3);
  assert.equal(score([completion("a", "reading", "2026-11-25T10:00:00.000Z")], DAY, TASKS), 1.1);
  assert.equal(
    score(
      [
        completion("a", "deep-work", "2026-11-25T10:00:00.000Z"),
        completion("b", "exercise", "2026-11-25T10:01:00.000Z"),
      ],
      DAY,
      TASKS,
    ),
    5.6, // 5/9*10 = 5.555... -> 5.6
  );
  assert.equal(
    score(
      TASKS.map((t, i) => completion(`id-${i}`, t.id, `2026-11-25T10:0${i}:00.000Z`)),
      DAY,
      TASKS,
    ),
    10,
  );
});

test("the last event per task wins, so uncompleting lowers the score", () => {
  const events = [
    completion("a", "deep-work", "2026-11-25T10:00:00.000Z"),
    completion("b", "deep-work", "2026-11-25T10:05:00.000Z", "task_uncompleted"),
  ];
  assert.equal(score(events, DAY, TASKS), 0);
});

test("ties on client_ts are broken by id", () => {
  const same = "2026-11-25T10:00:00.000Z";
  const lower = completion("aaaaaaaa", "deep-work", same, "task_uncompleted");
  const higher = completion("bbbbbbbb", "deep-work", same, "task_completed");
  assert.ok(compareEvents(lower, higher) < 0);
  // the higher id wins regardless of the order they are handed over
  assert.equal(score([lower, higher], DAY, TASKS), 3.3);
  assert.equal(score([higher, lower], DAY, TASKS), 3.3);
});

test("events from other days do not count", () => {
  const other = event({
    id: "x",
    type: "task_completed",
    payload: { taskId: "deep-work" },
    local_date: "2026-11-24",
  });
  assert.equal(score([other], DAY, TASKS), 0);
});

test("property: the same log in 20 random orders always gives the same score", () => {
  const log: StoredEvent[] = [
    completion("11111111", "deep-work", "2026-11-25T08:00:00.000Z"),
    completion("22222222", "deep-work", "2026-11-25T09:00:00.000Z", "task_uncompleted"),
    completion("33333333", "deep-work", "2026-11-25T09:30:00.000Z"),
    completion("44444444", "exercise", "2026-11-25T07:00:00.000Z"),
    completion("55555555", "study", "2026-11-25T11:00:00.000Z"),
    completion("66666666", "study", "2026-11-25T11:00:00.000Z", "task_uncompleted"),
    completion("77777777", "reading", "2026-11-25T12:00:00.000Z"),
    completion("88888888", "tidy", "2026-11-25T13:00:00.000Z"),
    completion("99999999", "tidy", "2026-11-25T14:00:00.000Z", "task_uncompleted"),
    completion("aaaaaaaa", "deep-work", "2026-11-24T23:00:00.000Z"),
  ];

  const expected = score(log, DAY, TASKS);
  for (let seed = 1; seed <= 20; seed++) {
    assert.equal(score(shuffle(log, seed), DAY, TASKS), expected, `order with seed ${seed} differs`);
  }
});

test("the day cutoff pushes the small hours back to the previous day", () => {
  assert.equal(localDate(new Date(2026, 10, 25, 3, 59)), "2026-11-24");
  assert.equal(localDate(new Date(2026, 10, 25, 4, 0)), "2026-11-25");
  assert.equal(localDate(new Date(2026, 10, 25, 23, 59)), "2026-11-25");
});

test("scores are shown with a comma and one decimal", () => {
  assert.equal(formatScore(10), "10,0");
  assert.equal(formatScore(5.555), "5,6");
  assert.equal(formatScore(0), "0,0");
});
