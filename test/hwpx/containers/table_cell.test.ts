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

  // D2. TableCell harvested .//hp:t and nothing else, so a cell holding a plate
  // rendered &nbsp;. Chapter 07 of the reference manuscript is 52 pages of plate
  // tables: 96 in-cell pics over 94 embedded BinData entries, every one
  // discarded — by BOTH implementations.
  describe("images inside a cell", () => {
    const BIN = new Map([
      ["image1", { href: "BinData/image1.jpg" }],
      ["image2", { href: "BinData/image2.jpg" }],
    ]);
    const PIC = (id: string, caption = ""): string =>
      `<hp:pic><hc:img binaryItemIDRef="${id}"/>` +
      (caption
        ? `<hp:caption><hp:subList><hp:p><hp:run><hp:t>${caption}</hp:t></hp:run></hp:p></hp:subList></hp:caption>`
        : "") +
      `</hp:pic>`;

    function cell(inner: string) {
      const doc = new DOMParser().parseFromString(
        `<hp:tc ${NS} xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">${inner}</hp:tc>`,
        "application/xml",
      );
      return doc.documentElement;
    }

    it("emits the image ahead of the caption text", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1")}<hp:t>경기전</hp:t></hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.toMarkdown()).toBe("![](fx.assets/fx-image1.jpg) 경기전");
    });

    // This is the &nbsp; that stands where every plate in chapter 07 belongs.
    it("emits the image instead of &nbsp; when the cell has no text", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1")}</hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.toMarkdown()).toBe("![](fx.assets/fx-image1.jpg)");
    });

    it("still emits &nbsp; for a cell with neither text nor image", () => {
      const c = TableCell.from(cell(`<hp:subList><hp:p/></hp:subList>`), BIN, "fx");
      expect(c.toMarkdown()).toBe("&nbsp;");
    });

    it("uses the pic's caption as alt text", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1", "경기전")}</hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.toMarkdown()).toBe("![경기전](fx.assets/fx-image1.jpg)");
    });

    it("exposes its images so the document can extract them", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1")}${PIC("image2")}</hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.images.map(i => i.binItemId)).toEqual(["image1", "image2"]);
    });

    // Raw markdown inside a <td> does not render. alt is `caption || "image"`,
    // matching the gem's ImageNode#to_html — NOT alt="".
    it("emits an <img> in the HTML span fallback", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1", "경기전")}<hp:t>caption</hp:t></hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.toHtmlTd()).toBe(
        `<td><img src="fx.assets/fx-image1.jpg" alt="경기전"> caption</td>`,
      );
    });

    it("falls back to alt=\"image\" in HTML when there is no caption", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1")}</hp:run></hp:p></hp:subList>`),
        BIN, "fx",
      );
      expect(c.toHtmlTd()).toBe(`<td><img src="fx.assets/fx-image1.jpg" alt="image"></td>`);
    });

    // The container tests call TableCell.from / TableRow.from / Table.from
    // directly with the old arity; the new parameters must stay optional.
    it("works with no binItems, as the existing tests call it", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>${PIC("image1")}<hp:t>text</hp:t></hp:run></hp:p></hp:subList>`),
      );
      expect(c.toMarkdown()).toBe("text");
      expect(c.images).toHaveLength(0);
    });
  });

  // A cell harvested .//hp:t and nothing else, so an equation inside it vanished.
  // In a 수능 paper the first item's stem lives in the masthead table cell, so
  // item 1 emitted <td></td> — a whole question lost to the same shape as the
  // caption and plate defects: collect one node type, silently drop the rest.
  describe("equations inside a cell", () => {
    function cell(inner: string) {
      const doc = new DOMParser().parseFromString(
        `<hp:tc ${NS}>${inner}</hp:tc>`,
        "application/xml",
      );
      return doc.documentElement;
    }

    it("renders an equation between the text around it", () => {
      const c = TableCell.from(
        cell(
          `<hp:subList><hp:p><hp:run>` +
            `<hp:t>함수</hp:t>` +
            `<hp:equation><hp:script>f(x)=2x ^{2} +5</hp:script></hp:equation>` +
            `<hp:t>의 값은?</hp:t>` +
          `</hp:run></hp:p></hp:subList>`,
        ),
      );
      expect(c.toMarkdown()).toContain("$$");
      // No added separator — concatenation in document order, matching how
      // renderWithInlineEquations already joins text and inline equations.
      expect(c.toMarkdown()).toBe("함수$$f(x)=2x ^ {2} +5$$의 값은?");
    });

    it("renders a cell whose only content is an equation", () => {
      const c = TableCell.from(
        cell(`<hp:subList><hp:p><hp:run>` +
          `<hp:equation><hp:script>x ^{2}</hp:script></hp:equation>` +
          `</hp:run></hp:p></hp:subList>`),
      );
      expect(c.toMarkdown()).not.toBe("&nbsp;");
      expect(c.toMarkdown()).toContain("$$");
    });
  });
});
