import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";

const SOURCES = path.resolve(__dirname, "../fixtures/hwpx/sources");
const EXPECTED = path.resolve(__dirname, "../fixtures/hwpx/expected");

/**
 * Line-sequence parity — spec §6.3 Phase 2+3 exception. Identical to
 * phase2-parity.test.ts's normalizer: drop blank / whitespace-only
 * lines, compare remaining lines element-wise with full content (no
 * trimming of in-line whitespace).
 */
function lineSequence(s: string): string[] {
  return s.split("\n").filter(l => l.trim() !== "");
}

const FIXTURES = ["sample_table"] as const;

describe("Phase 3 parity — table fixture (line-sequence)", () => {
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
