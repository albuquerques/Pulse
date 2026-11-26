import { VERSION } from "@pulse/core";
import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

describe("GET /api/health", () => {
  it("answers ok with the version from @pulse/core", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, version: VERSION });
  });

  it("404s on an unknown route", async () => {
    const response = await app.request("/api/nope");

    expect(response.status).toBe(404);
  });
});
