import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";

const SOURCES = path.resolve(__dirname, "../fixtures/hwpx/sources");
const EXPECTED = path.resolve(__dirname, "../fixtures/hwpx/expected");

/**
 * Line-sequence parity — spec §6.3 Phase 2+3 exception.
 * Drop blank / whitespace-only lines; keep every other line's content intact
 * (no trimming) so that Markdown-meaningful whitespace at line edges is
 * preserved in the comparison.
 */
function lineSequence(s: string): string[] {
  return s.split("\n").filter(l => l.trim() !== "");
}

const FIXTURES = ["sample1", "sample3"] as const;

describe("Phase 2 parity — text-only fixtures (line-sequence)", () => {
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
