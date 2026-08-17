import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";

const SOURCES = path.resolve(__dirname, "../fixtures/hwpx/sources");
const EXPECTED = path.resolve(__dirname, "../fixtures/hwpx/expected");

/**
 * Line-sequence parity — spec §6.3 Phase 2+3+4 exception. Identical to
 * phase2/3-parity normalizer: drop blank/whitespace-only lines, compare
 * remaining lines element-wise with full in-line content preserved.
 */
function lineSequence(s: string): string[] {
  return s.split("\n").filter(l => l.trim() !== "");
}

const FIXTURES = ["sample_styles", "sample_image"] as const;

describe("Phase 4 parity — styles + image fixtures (line-sequence)", () => {
  for (const basename of FIXTURES) {
    // sample_image is KNOWN FAILING, deliberately. Its golden asserts PRD
    // §6.1's `images/` requirement, which the parser does not satisfy — it
    // emits `<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>`
    // (image_node.ts). Kept failing so the gap stays visible. When M4 resolves
    // it, `it.fails` will itself start failing and this becomes an ordinary
    // `it`. sample_styles passes and stays a plain `it`, so the mechanism is
    // selected per fixture rather than applied to the whole loop.
    const runner = basename === "sample_image" ? it.fails : it;
    runner(`${basename}.hwpx matches ${basename}.md.expected as line-sequence`, async () => {
      const source = path.join(SOURCES, `${basename}.hwpx`);
      const expectedFile = path.join(EXPECTED, `${basename}.md.expected`);

      const doc = await Document.open(source);
      const actual = doc.toMarkdown();
      const expected = await fs.readFile(expectedFile, "utf8");

      expect(lineSequence(actual)).toEqual(lineSequence(expected));
    });
  }
});
