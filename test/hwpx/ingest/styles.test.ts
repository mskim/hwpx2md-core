import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { parseCharPrTable } from "../../../src/hwpx/ingest/styles";

const NS = [
  `xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"`,
].join(" ");

function parseHeader(charPrs: string): Document {
  const xml = `<hh:head ${NS}><hh:refList><hh:charProperties>${charPrs}</hh:charProperties></hh:refList></hh:head>`;
  return new DOMParser().parseFromString(xml, "application/xml") as unknown as Document;
}

describe("parseCharPrTable", () => {
  it("detects bold via <hh:bold/> presence", () => {
    const doc = parseHeader(`<hh:charPr id="1"><hh:bold/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("1")).toEqual({ bold: true, italic: false, underline: false, strikethrough: false, supscript: false, subscript: false });
  });

  it("detects italic via <hh:italic/> presence", () => {
    const doc = parseHeader(`<hh:charPr id="2"><hh:italic/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("2")).toEqual({ bold: false, italic: true, underline: false, strikethrough: false, supscript: false, subscript: false });
  });

  it("detects underline via <hh:underline type='SOLID'/>", () => {
    const doc = parseHeader(`<hh:charPr id="3"><hh:underline type="SOLID"/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("3")).toEqual({ bold: false, italic: false, underline: true, strikethrough: false, supscript: false, subscript: false });
  });

  it("treats <hh:underline type='NONE'/> as no underline", () => {
    const doc = parseHeader(`<hh:charPr id="4"><hh:underline type="NONE"/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("4")).toEqual({ bold: false, italic: false, underline: false, strikethrough: false, supscript: false, subscript: false });
  });

  it("combines bold + italic + underline when all three are present", () => {
    const doc = parseHeader(
      `<hh:charPr id="5"><hh:bold/><hh:italic/><hh:underline type="SOLID"/></hh:charPr>`,
    );
    const table = parseCharPrTable(doc);
    expect(table.get("5")).toEqual({ bold: true, italic: true, underline: true, strikethrough: false, supscript: false, subscript: false });
  });

  it("detects strikethrough via <hh:strikeout shape='SOLID'/>", () => {
    const doc = parseHeader(`<hh:charPr id="6"><hh:strikeout shape="SOLID"/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("6")).toEqual({ bold: false, italic: false, underline: false, strikethrough: true, supscript: false, subscript: false });
  });

  it("treats <hh:strikeout shape='NONE'/> as no strikethrough", () => {
    const doc = parseHeader(`<hh:charPr id="7"><hh:strikeout shape="NONE"/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("7")).toEqual({ bold: false, italic: false, underline: false, strikethrough: false, supscript: false, subscript: false });
  });

  it("detects supscript via <hh:supscript/> presence", () => {
    const doc = parseHeader(`<hh:charPr id="8"><hh:supscript/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("8")).toEqual({ bold: false, italic: false, underline: false, strikethrough: false, supscript: true, subscript: false });
  });

  it("detects subscript via <hh:subscript/> presence", () => {
    const doc = parseHeader(`<hh:charPr id="9"><hh:subscript/></hh:charPr>`);
    const table = parseCharPrTable(doc);
    expect(table.get("9")).toEqual({ bold: false, italic: false, underline: false, strikethrough: false, supscript: false, subscript: true });
  });

  it("returns an empty map when no charPr entries exist", () => {
    const doc = parseHeader(``);
    const table = parseCharPrTable(doc);
    expect(table.size).toBe(0);
  });
});
