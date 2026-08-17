import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";

const SOURCES_DIR = path.resolve(__dirname, "../fixtures/hwpx/sources");
const COUNTS_FILE = path.resolve(__dirname, "../fixtures/hwpx/paragraph-counts.json");

describe("Phase 1 parity — paragraph counts match Ruby", async () => {
  const rawCounts = JSON.parse(await fs.readFile(COUNTS_FILE, "utf8")) as Record<string, number>;

  for (const [basename, expectedCount] of Object.entries(rawCounts)) {
    it(`${basename}.hwpx yields ${expectedCount} paragraphs`, async () => {
      const fixture = path.join(SOURCES_DIR, `${basename}.hwpx`);
      const doc = await Document.open(fixture);
      expect(doc.paragraphs()).toHaveLength(expectedCount);
    });
  }
});
