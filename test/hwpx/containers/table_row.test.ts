import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { TableRow } from "../../../src/hwpx/containers/table_row";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function parseRow(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:tr ${NS}>${inner}</hp:tr>`,
    "application/xml",
  );
  return doc.documentElement;
}

function cell(text: string): string {
  return `<hp:tc><hp:subList><hp:p><hp:run><hp:t>${text}</hp:t></hp:run></hp:p></hp:subList></hp:tc>`;
}

describe("TableRow", () => {
  it("renders a three-cell row with pipe delimiters and padding spaces", () => {
    const r = TableRow.from(parseRow(cell("1-1") + cell("1-2") + cell("1-3")));
    expect(r.toMarkdown()).toBe("| 1-1 | 1-2 | 1-3 |");
  });

  it("renders a single-cell row", () => {
    const r = TableRow.from(parseRow(cell("only")));
    expect(r.toMarkdown()).toBe("| only |");
  });

  it("passes &nbsp; through from empty cells", () => {
    const r = TableRow.from(parseRow(cell("a") + `<hp:tc/>` + cell("c")));
    expect(r.toMarkdown()).toBe("| a | &nbsp; | c |");
  });

  it("exposes .cells for debugging", () => {
    const r = TableRow.from(parseRow(cell("x") + cell("y")));
    expect(r.cells).toHaveLength(2);
  });
});
