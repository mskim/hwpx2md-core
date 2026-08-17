import { describe, expect, it } from "vitest";
import * as path from "node:path";

import { createHwpxConverter, ConversionError, Document } from "../src/index";

const SAMPLE = path.resolve(__dirname, "fixtures/hwpx/sources/sample1.hwpx");

describe("package entry point", () => {
  it("exposes a Converter whose convert() returns markdown", async () => {
    const result = await createHwpxConverter().convert(SAMPLE);
    expect(typeof result.markdown).toBe("string");
    expect(result.markdown.length).toBeGreaterThan(0);
  });

  it("names itself for logs", () => {
    expect(createHwpxConverter().name).toBe("typescript:hwpx2md");
  });

  it("re-exports Document for callers that need the low-level API", async () => {
    const doc = await Document.open(SAMPLE);
    expect(doc.toMarkdown()).toBe((await createHwpxConverter().convert(SAMPLE)).markdown);
  });

  it("re-exports ConversionError as a value, not just a type", () => {
    expect(new ConversionError("x").name).toBe("ConversionError");
  });
});
