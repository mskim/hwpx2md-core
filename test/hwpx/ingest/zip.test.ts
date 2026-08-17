import { describe, expect, it } from "vitest";
import * as path from "node:path";

import { openHwpx } from "../../../src/hwpx/ingest/zip";

const FIXTURE = path.resolve(__dirname, "../../fixtures/hwpx/sources/sample1.hwpx");

describe("ingest/zip", () => {
  it("opens an HWPX file and lists entries", async () => {
    const entries = await openHwpx(FIXTURE);
    expect(entries.size).toBeGreaterThan(0);
    expect([...entries.keys()]).toContain("Contents/content.hpf");
  });

  it("returns entry contents as Buffer", async () => {
    const entries = await openHwpx(FIXTURE);
    const hpf = entries.get("Contents/content.hpf");
    expect(hpf).toBeInstanceOf(Buffer);
    expect(hpf!.length).toBeGreaterThan(0);
  });

  it("contains at least one Contents/section*.xml entry", async () => {
    const entries = await openHwpx(FIXTURE);
    const sections = [...entries.keys()].filter(k => /^Contents\/section\d+\.xml$/.test(k));
    expect(sections.length).toBeGreaterThan(0);
  });
});
