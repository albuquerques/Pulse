import { describe, expect, it } from "vitest";
import { VERSION } from "./index.ts";

describe("@pulse/core", () => {
  it("exposes a version the API can report", () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
