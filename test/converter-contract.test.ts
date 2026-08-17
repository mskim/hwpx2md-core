import { describe, expect, it } from "vitest";

import { ConversionError, ConversionResult, Converter } from "../src/types";

/**
 * Contract tests for the Converter interface. The TypeScript HWPX engine
 * must satisfy these shape checks at every phase.
 *
 * Fixture-driven parity tests live in test/hwpx/parity.test.ts and are
 * phase-gated — see docs/superpowers/specs/2026-04-19-hwpx-ts-port-design.md §6.
 */

class StubConverter implements Converter {
  readonly name = "stub";
  async convert(_sourcePath: string): Promise<ConversionResult> {
    return { markdown: "# stub\n", warnings: ["ok"] };
  }
}

describe("Converter contract", () => {
  it("returns a result with a markdown string", async () => {
    const c = new StubConverter();
    const r = await c.convert("irrelevant.hwpx");
    expect(r.markdown).toContain("stub");
  });

  it("accepts optional warnings", async () => {
    const c = new StubConverter();
    const r = await c.convert("x");
    expect(r.warnings).toEqual(["ok"]);
  });

  it("ConversionError carries a cause", () => {
    const cause = new Error("boom");
    const err = new ConversionError("failed", cause);
    expect(err.cause).toBe(cause);
    expect(err.name).toBe("ConversionError");
  });
});
