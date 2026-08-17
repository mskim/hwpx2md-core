import { describe, expect, it } from "vitest";
import * as path from "node:path";

import { Document } from "../../src/hwpx/document";
import { Paragraph } from "../../src/hwpx/containers/paragraph";

const FIXTURE = path.resolve(__dirname, "../fixtures/hwpx/sources/sample1.hwpx");

describe("Document", () => {
  it("opens an HWPX file", async () => {
    const doc = await Document.open(FIXTURE);
    expect(doc).toBeInstanceOf(Document);
  });

  it("yields at least one paragraph", async () => {
    const doc = await Document.open(FIXTURE);
    expect(doc.paragraphs().length).toBeGreaterThan(0);
  });

  it("paragraphs() returns typed Paragraph instances", async () => {
    const doc = await Document.open(FIXTURE);
    const paragraphs = doc.paragraphs();
    expect(paragraphs[0]).toBeInstanceOf(Paragraph);
  });

  it("toMarkdown() returns a non-empty string for a text fixture", async () => {
    const doc = await Document.open(FIXTURE);
    const md = doc.toMarkdown();
    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(0);
  });

  it("assets() returns image buffers for referenced hp:pic paragraphs", async () => {
    const fixture = path.resolve(__dirname, "../fixtures/hwpx/sources/sample_image.hwpx");
    const doc = await Document.open(fixture);
    const assets = doc.assets();
    expect(assets.length).toBeGreaterThan(0);
    const first = assets[0];
    expect(first.relativePath).toMatch(/^images\//);
    expect(Buffer.isBuffer(first.content)).toBe(true);
    expect(first.content.length).toBeGreaterThan(0);
  });
});
