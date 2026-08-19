import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { EndNote } from "../../../src/hwpx/exam/endnote";

const NS = [
  `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`,
  `xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"`,
].join(" ");

/** Without the xmlns declaration `hp:subList/hp:p` returns zero nodes. */
function parseNote(body: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:endNote ${NS} number="7"><hp:subList><hp:p><hp:run>${body}` +
      `</hp:run></hp:p></hp:subList></hp:endNote>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("EndNote", () => {
  const BIN = new Map([["image1", { href: "BinData/image1.jpg" }]]);

  it("reads the problem number from @number", () => {
    expect(EndNote.from(parseNote(`<hp:t>④</hp:t>`)).number).toBe(7);
  });

  // THE defect this class exists for. The footnote path collects hp:t only;
  // cloning it would discard 4,867 equations across the four exam papers —
  // every worked solution reduced to its connecting words.
  it("keeps equations, in place, between the text around them", () => {
    const n = EndNote.from(
      parseNote(
        `<hp:t>①에서</hp:t>` +
          `<hp:equation><hp:script>f(x)=2x ^{2} +5</hp:script></hp:equation>` +
          `<hp:t>이므로</hp:t>`,
      ),
    );
    expect(n.bodyMarkdown).toContain("$$");
    expect(n.bodyMarkdown).toBe("①에서$$f(x)=2x^{2}+5$$이므로");
  });

  it("normalises the LaTeX it emits", () => {
    const n = EndNote.from(
      parseNote(`<hp:equation><hp:script>rm P( it a)</hp:script></hp:equation>`),
    );
    expect(n.bodyMarkdown).not.toContain("\\rm");
    expect(n.bodyMarkdown).not.toContain("\\it");
  });

  it("keeps figures that belong to the explanation", () => {
    const n = EndNote.from(
      parseNote(`<hp:t>그림</hp:t><hp:pic><hc:img binaryItemIDRef="image1"/></hp:pic>`),
      BIN,
      "fx",
    );
    expect(n.bodyMarkdown).toContain("![](fx.assets/fx-image1.jpg)");
    expect(n.images.map((i) => i.binItemId)).toEqual(["image1"]);
  });

  it("keeps a table that belongs to the explanation", () => {
    const n = EndNote.from(
      parseNote(
        `<hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>극대</hp:t>` +
          `</hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl>`,
      ),
    );
    expect(n.bodyMarkdown).toContain("극대");
    expect(n.bodyMarkdown).toContain("|");
  });

  // hp:subList//hp:p walks table-cell paragraphs a second time — 30 vs 12 in one
  // real endnote — so the cell text would render once in the table and again as
  // a loose paragraph.
  it("does not walk table-cell paragraphs twice", () => {
    const n = EndNote.from(
      parseNote(
        `<hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>극대</hp:t>` +
          `</hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl>`,
      ),
    );
    expect(n.bodyMarkdown.match(/극대/g)).toHaveLength(1);
  });
});
