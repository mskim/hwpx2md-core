import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { parseBinItemTable } from "../../../src/hwpx/ingest/bin_items";

const NS = `xmlns:opf="http://www.idpf.org/2007/opf/"`;

function parseHpf(items: string): Document {
  const xml = `<opf:package ${NS}><opf:manifest>${items}</opf:manifest></opf:package>`;
  return new DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
}

describe("parseBinItemTable", () => {
  it("maps id to href for each opf:item", () => {
    const doc = parseHpf(
      `<opf:item id="image1" href="BinData/image1.jpg" media-type="image/jpg"/>` +
      `<opf:item id="image2" href="BinData/image2.png" media-type="image/png"/>`,
    );
    const table = parseBinItemTable(doc);
    expect(table.get("image1")).toEqual({ href: "BinData/image1.jpg" });
    expect(table.get("image2")).toEqual({ href: "BinData/image2.png" });
  });

  it("ignores items without an id attribute", () => {
    const doc = parseHpf(
      `<opf:item href="BinData/orphan.jpg" media-type="image/jpg"/>`,
    );
    const table = parseBinItemTable(doc);
    expect(table.size).toBe(0);
  });

  it("keeps non-BinData items (filtering is the caller's job)", () => {
    const doc = parseHpf(
      `<opf:item id="header" href="Contents/header.xml" media-type="application/xml"/>`,
    );
    const table = parseBinItemTable(doc);
    expect(table.get("header")).toEqual({ href: "Contents/header.xml" });
  });

  it("returns an empty map when there are no items", () => {
    const doc = parseHpf(``);
    const table = parseBinItemTable(doc);
    expect(table.size).toBe(0);
  });
});
