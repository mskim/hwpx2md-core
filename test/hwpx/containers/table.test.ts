import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { Table } from "../../../src/hwpx/containers/table";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function parseTable(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:tbl ${NS}>${inner}</hp:tbl>`,
    "application/xml",
  );
  return doc.documentElement;
}

function cell(text: string): string {
  return `<hp:tc><hp:subList><hp:p><hp:run><hp:t>${text}</hp:t></hp:run></hp:p></hp:subList></hp:tc>`;
}

function row(...cellTexts: string[]): string {
  return `<hp:tr>${cellTexts.map(cell).join("")}</hp:tr>`;
}

describe("Table", () => {
  it("renders a 3x3 table with header, separator, and body rows", () => {
    const t = Table.from(
      parseTable(
        row("1-1", "1-2", "1-3") +
        row("2-1", "2-2", "2-3") +
        row("3-1", "3-2", "3-3"),
      ),
    );
    expect(t.toMarkdown()).toBe(
      "| 1-1 | 1-2 | 1-3 |\n" +
      "| --- | --- | --- |\n" +
      "| 2-1 | 2-2 | 2-3 |\n" +
      "| 3-1 | 3-2 | 3-3 |",
    );
  });

  it("inserts the separator even when there is only one row (empty body)", () => {
    const t = Table.from(parseTable(row("only", "header")));
    expect(t.toMarkdown()).toBe(
      "| only | header |\n| --- | --- |",
    );
  });

  it("returns empty string for a table with no rows", () => {
    const t = Table.from(parseTable(""));
    expect(t.toMarkdown()).toBe("");
  });

  it("exposes .rows for debugging", () => {
    const t = Table.from(parseTable(row("x") + row("y")));
    expect(t.rows).toHaveLength(2);
  });
});
