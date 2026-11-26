import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { Client } from "pg";

const API_URL = "http://localhost:8787";
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://pulse:pulse@localhost:5433/pulse_proto";

/** Counts rows straight in Postgres, not through an endpoint of the app itself. */
async function countEventsInDatabase(): Promise<number> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ count: string }>("select count(*) from events");
    return Number(rows[0]!.count);
  } finally {
    await client.end();
  }
}

/** "API unreachable" — Vite keeps serving the page, only /sync/* is cut off. */
async function goOffline(page: Page): Promise<void> {
  await page.route("**/sync/**", (route) => route.abort());
}

async function goOnline(page: Page): Promise<void> {
  await page.unroute("**/sync/**");
}

async function openDevice(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByTestId("device-id")).not.toHaveText("—");
  return page;
}

function score(page: Page) {
  return page.getByTestId("score");
}

function eventCount(page: Page) {
  return page.getByTestId("event-count");
}

async function complete(page: Page, taskId: string): Promise<void> {
  await page.getByTestId(`task-${taskId}`).click();
  await expect(page.getByTestId(`task-${taskId}-state`)).toHaveText("concluída");
}

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${API_URL}/test/reset`);
  expect(response.ok()).toBeTruthy();
});

test("A escreve offline, B escreve online e os dois convergem", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const a = await openDevice(contextA);
  const b = await openDevice(contextB);

  // Criterion 1: A is offline, completes 3 tasks, and the score changes at once.
  await goOffline(a);
  await complete(a, "deep-work"); // 3
  await complete(a, "exercise"); //  2
  await complete(a, "study"); //     2
  await expect(score(a)).toHaveText("7,8"); // 7/9*10 = 7.77... -> 7,8
  await expect(a.getByTestId("outbox-size")).toHaveText("3");
  await expect(a.getByTestId("last-seq")).toHaveText("0");

  // Criterion 2: B is online and completes a different task.
  await complete(b, "reading"); // 1
  await expect(score(b)).toHaveText("1,1");
  await expect(b.getByTestId("outbox-size")).toHaveText("0");

  // Criterion 3: A comes back online and both converge within 5 s.
  const startedAt = Date.now();
  await goOnline(a);
  await expect(eventCount(a)).toHaveText("4", { timeout: 5_000 });
  await expect(eventCount(b)).toHaveText("4", { timeout: 5_000 });
  await expect(score(a)).toHaveText("8,9", { timeout: 5_000 }); // 8/9*10 = 8.88... -> 8,9
  await expect(score(b)).toHaveText("8,9", { timeout: 5_000 });
  const convergedIn = Date.now() - startedAt;
  console.log(`[criterio 3] convergiu em ${convergedIn} ms`);
  expect(convergedIn).toBeLessThan(5_000);

  await expect(a.getByTestId("outbox-size")).toHaveText("0");
  expect(await countEventsInDatabase()).toBe(4);

  await contextA.close();
  await contextB.close();
});

test("reenviar o mesmo lote não duplica nada no banco", async ({ browser, request }) => {
  const context = await browser.newContext();
  const page = await openDevice(context);

  await complete(page, "deep-work");
  await complete(page, "exercise");
  await expect(page.getByTestId("outbox-size")).toHaveText("0", { timeout: 5_000 });

  // Take the batch back from the server, the way a client that lost its answer would.
  const pulled = await request.get(`${API_URL}/sync/pull?after=0`);
  const { events } = (await pulled.json()) as { events: unknown[] };
  const batch = { events };
  expect(events).toHaveLength(2);
  expect(await countEventsInDatabase()).toBe(2);

  // Criterion 4: the very same batch, three more times.
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await request.post(`${API_URL}/sync/push`, { data: batch });
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { accepted: { id: string; server_seq: number }[] };
    // Ids already stored still come back, so a retrying client can drain its outbox.
    expect(body.accepted).toHaveLength(2);
    expect(await countEventsInDatabase()).toBe(2);
  }

  await context.close();
});

test("recarregar com a API inalcançável mantém os eventos locais e a nota", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await openDevice(context);

  await goOffline(page);
  await complete(page, "deep-work");
  await complete(page, "tidy");
  await expect(score(page)).toHaveText("4,4"); // 4/9*10 = 4.44... -> 4,4
  await expect(page.getByTestId("outbox-size")).toHaveText("2");

  // Criterion 5: reload while the API stays unreachable.
  await page.reload();
  await expect(page.getByTestId("device-id")).not.toHaveText("—");
  await expect(score(page)).toHaveText("4,4");
  await expect(eventCount(page)).toHaveText("2");
  await expect(page.getByTestId("outbox-size")).toHaveText("2");
  await expect(page.getByTestId("task-deep-work-state")).toHaveText("concluída");
  await expect(page.getByTestId("task-tidy-state")).toHaveText("concluída");

  // And once the API is back, the queue drains on its own.
  await goOnline(page);
  await expect(page.getByTestId("outbox-size")).toHaveText("0", { timeout: 5_000 });
  expect(await countEventsInDatabase()).toBe(2);

  await context.close();
});
