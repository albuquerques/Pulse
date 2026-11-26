import { VERSION } from "@pulse/core";
import { Hono } from "hono";

/**
 * The Hono app, kept apart from the process that serves it so tests can call
 * `app.request()` without opening a port. T6 will add the sync routes here.
 */
export const app = new Hono();

/**
 * Reports the running version, read from @pulse/core. Importing it here is what
 * proves the packages are wired together: if core stops building, this breaks.
 */
app.get("/api/health", (c) => c.json({ ok: true, version: VERSION }));

export type App = typeof app;
