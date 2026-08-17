import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { TableCell } from "../../../src/hwpx/containers/table_cell";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function parseCell(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:tc ${NS}>${inner}</hp:tc>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("TableCell", () => {
  it("extracts text from a cell with one paragraph", () => {
    const c = TableCell.from(
      parseCell(`<hp:subList><hp:p><hp:run><hp:t>1-1</hp:t></hp:run></hp:p></hp:subList>`),
    );
    expect(c.toMarkdown()).toBe("1-1");
  });

  it("concatenates text across multiple hp:t descendants", () => {
    const c = TableCell.from(
      parseCell(
        `<hp:subList><hp:p><hp:run><hp:t>foo</hp:t></hp:run><hp:run><hp:t>bar</hp:t></hp:run></hp:p></hp:subList>`,
      ),
    );
    expect(c.toMarkdown()).toBe("foobar");
  });

  it("escapes pipe characters in cell content", () => {
    const c = TableCell.from(
      parseCell(`<hp:subList><hp:p><hp:run><hp:t>a|b</hp:t></hp:run></hp:p></hp:subList>`),
    );
    expect(c.toMarkdown()).toBe("a\\|b");
  });

  it("returns &nbsp; for an empty cell", () => {
    const c = TableCell.from(parseCell(``));
    expect(c.toMarkdown()).toBe("&nbsp;");
  });

  it("returns &nbsp; for a whitespace-only cell", () => {
    const c = TableCell.from(
      parseCell(`<hp:subList><hp:p><hp:run><hp:t>   </hp:t></hp:run></hp:p></hp:subList>`),
    );
    expect(c.toMarkdown()).toBe("&nbsp;");
  });
});
