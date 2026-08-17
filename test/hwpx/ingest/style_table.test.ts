import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { StyleTable } from "../../../src/hwpx/ingest/style_table";

const NS = [
  `xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"`,
].join(" ");

function parseHeader(styles: string): Document {
  const xml = `<hh:head ${NS}><hh:refList><hh:styles>${styles}</hh:styles></hh:refList></hh:head>`;
  return new DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
}

describe("StyleTable", () => {
  it("returns undefined for nameFor on empty header", () => {
    const doc = parseHeader(``);
    const table = StyleTable.fromHeader(doc);
    expect(table.nameFor("0")).toBeUndefined();
  });

  it("returns undefined for headingLevelFor on empty header", () => {
    const doc = parseHeader(``);
    const table = StyleTable.fromHeader(doc);
    expect(table.headingLevelFor("0")).toBeUndefined();
  });

  it("returns '차례 제목' for nameFor('17') and level 1 for headingLevelFor('17')", () => {
    const doc = parseHeader(`<hh:style id="17" name="차례 제목"/>`);
    const table = StyleTable.fromHeader(doc);
    expect(table.nameFor("17")).toBe("차례 제목");
    expect(table.headingLevelFor("17")).toBe(1);
  });

  it("maps 차례 1 → level 2", () => {
    const doc = parseHeader(`<hh:style id="18" name="차례 1"/>`);
    const table = StyleTable.fromHeader(doc);
    expect(table.headingLevelFor("18")).toBe(2);
  });

  it("maps 차례 2 → level 3", () => {
    const doc = parseHeader(`<hh:style id="19" name="차례 2"/>`);
    const table = StyleTable.fromHeader(doc);
    expect(table.headingLevelFor("19")).toBe(3);
  });

  it("maps 차례 3 → level 4", () => {
    const doc = parseHeader(`<hh:style id="20" name="차례 3"/>`);
    const table = StyleTable.fromHeader(doc);
    expect(table.headingLevelFor("20")).toBe(4);
  });

  it("returns the name for non-TOC style but undefined for headingLevelFor", () => {
    const doc = parseHeader(`<hh:style id="0" name="바탕글"/>`);
    const table = StyleTable.fromHeader(doc);
    expect(table.nameFor("0")).toBe("바탕글");
    expect(table.headingLevelFor("0")).toBeUndefined();
  });
});
