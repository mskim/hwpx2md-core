import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";

const SOURCES = path.resolve(__dirname, "../fixtures/hwpx/sources");
const EXPECTED = path.resolve(__dirname, "../fixtures/hwpx/expected");

/**
 * Line-sequence parity — spec §6.3 Phase 2+3+4+5 exception. Identical
 * to phase2/3/4 parity normalizer: drop blank/whitespace-only lines,
 * compare remaining lines element-wise with full in-line content
 * preserved. The three fence lines (```hwp-equation, the source,
 * and ```) are non-empty and must each match exactly.
 */
function lineSequence(s: string): string[] {
  return s.split("\n").filter(l => l.trim() !== "");
}

const FIXTURES = ["sample_math"] as const;

describe("Phase 5 parity — equation fixture (line-sequence)", () => {
  for (const basename of FIXTURES) {
    it(`${basename}.hwpx matches ${basename}.md.expected as line-sequence`, async () => {
      const source = path.join(SOURCES, `${basename}.hwpx`);
      const expectedFile = path.join(EXPECTED, `${basename}.md.expected`);

      const doc = await Document.open(source);
      const actual = doc.toMarkdown();
      const expected = await fs.readFile(expectedFile, "utf8");

      expect(lineSequence(actual)).toEqual(lineSequence(expected));
    });
  }
});
