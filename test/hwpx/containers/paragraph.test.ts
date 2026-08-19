import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { Paragraph } from "../../../src/hwpx/containers/paragraph";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function parseParagraph(inner: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:p ${NS}>${inner}</hp:p>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("Paragraph", () => {
  it("renders a single-run paragraph as its text", () => {
    const p = Paragraph.from(
      parseParagraph(`<hp:run><hp:t>hello world</hp:t></hp:run>`),
    );
    expect(p.toMarkdown()).toBe("hello world");
  });

  it("concatenates multiple runs with no separator (Ruby to_s parity)", () => {
    const p = Paragraph.from(
      parseParagraph(
        `<hp:run><hp:t>foo</hp:t></hp:run><hp:run><hp:t>bar</hp:t></hp:run>`,
      ),
    );
    expect(p.toMarkdown()).toBe("foobar");
  });

  it("renders an empty paragraph as empty string", () => {
    const p = Paragraph.from(parseParagraph(""));
    expect(p.toMarkdown()).toBe("");
  });

  it("exposes its runs for debugging / phase-3 extension", () => {
    const p = Paragraph.from(
      parseParagraph(`<hp:run><hp:t>a</hp:t></hp:run>`),
    );
    expect(p.textRuns).toHaveLength(1);
  });

  it("delegates toMarkdown to Table when paragraph wraps an hp:tbl", () => {
    const p = Paragraph.from(
      parseParagraph(
        `<hp:run><hp:tbl>` +
          `<hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>a</hp:t></hp:run></hp:p></hp:subList></hp:tc>` +
          `<hp:tc><hp:subList><hp:p><hp:run><hp:t>b</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr>` +
          `<hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>c</hp:t></hp:run></hp:p></hp:subList></hp:tc>` +
          `<hp:tc><hp:subList><hp:p><hp:run><hp:t>d</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr>` +
        `</hp:tbl></hp:run>`,
      ),
    );
    expect(p.toMarkdown()).toBe(
      "\n| a | b |\n|---|---|\n| c | d |\n\n",
    );
  });

  // KNOWN FAILING, deliberately. This asserts PRD §6.1's `images/` requirement,
  // which the parser does not satisfy — it emits
  // `<sourceBasename>.assets/<sourceBasename>-<binItemId>.<ext>` (image_node.ts).
  // Kept failing so the gap stays visible. When M4 resolves it, `it.fails` will
  // itself start failing and these become ordinary `it`.
  it.fails("delegates to ImageNode when paragraph wraps hp:pic and binItems is provided", () => {
    const ns = [
      `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`,
      `xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core"`,
    ].join(" ");
    const doc = new DOMParser().parseFromString(
      `<hp:p ${ns}><hp:run><hp:pic><hc:img binaryItemIDRef="image1"/></hp:pic></hp:run></hp:p>`,
      "application/xml",
    );
    const p = Paragraph.from(
      doc.documentElement,
      undefined,
      new Map([["image1", { href: "BinData/image1.jpg" }]]),
    );
    expect(p.toMarkdown()).toBe("![](images/image1.jpg)");
  });

  it("applies inline style when charPrTable is provided", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:p ${ns}><hp:run charPrIDRef="7"><hp:t>bold run</hp:t></hp:run></hp:p>`,
      "application/xml",
    );
    const p = Paragraph.from(
      doc.documentElement,
      new Map([["7", { bold: true, italic: false, underline: false }]]),
    );
    expect(p.toMarkdown()).toBe("**bold run**");
  });

  it("delegates to MathNode when paragraph wraps an hp:equation", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:p ${ns}><hp:run><hp:equation><hp:script>{3x} over {y+z+b}</hp:script></hp:equation></hp:run></hp:p>`,
      "application/xml",
    );
    const p = Paragraph.from(doc.documentElement);
    // EqToLatex now converts to display LaTeX ($$...$$) instead of fenced fallback
    expect(p.toMarkdown()).toBe("$$\\dfrac {3x}{y+z+b}$$");
  });

  // D1. The dispatch used to be either/or: a paragraph with an hp:pic became
  // ImageNode[] and its text runs were never read. 18 paragraphs in the
  // reference manuscript lost their prose that way — the 추천사 pages, where a
  // signature image sits beside a testimonial.
  describe("free pics are a prefix, not a mode", () => {
    const BIN = new Map([
      ["image1", { href: "BinData/image1.jpg" }],
      ["image2", { href: "BinData/image2.jpg" }],
    ]);
    const PIC = (id: string): string =>
      `<hp:pic><hc:img binaryItemIDRef="${id}"/></hp:pic>`;

    function pic(inner: string) {
      const doc = new DOMParser().parseFromString(
        `<hp:p ${NS} xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">${inner}</hp:p>`,
        "application/xml",
      );
      return doc.documentElement;
    }

    it("emits the image, a blank line, then the text", () => {
      const p = Paragraph.from(
        pic(`<hp:run>${PIC("image1")}<hp:t>testimonial</hp:t></hp:run>`),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.toMarkdown()).toBe("![](fx.assets/fx-image1.jpg)\n\ntestimonial");
    });

    // The gem's skip_para, and what holds the three existing image goldens
    // byte-identical: an image paragraph with no prose is unchanged.
    it("emits the image alone when the text is empty", () => {
      const p = Paragraph.from(
        pic(`<hp:run>${PIC("image1")}</hp:run>`),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.toMarkdown()).toBe("![](fx.assets/fx-image1.jpg)");
    });

    it("emits the image alone when the text is only whitespace", () => {
      const p = Paragraph.from(
        pic(`<hp:run>${PIC("image1")}<hp:t>   </hp:t></hp:run>`),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.toMarkdown()).toBe("![](fx.assets/fx-image1.jpg)");
    });

    // The gem pushes each image as its own content entry and ImageNode#to_markdown
    // already ends in "\n", so content.join("\n") yields a BLANK LINE between
    // them. Joining with a single "\n" here would diverge silently — three
    // paragraphs in the reference book have two free pics.
    it("separates two free pics with a blank line", () => {
      const p = Paragraph.from(
        pic(`<hp:run>${PIC("image1")}${PIC("image2")}</hp:run>`),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.toMarkdown()).toBe(
        "![](fx.assets/fx-image1.jpg)\n\n![](fx.assets/fx-image2.jpg)",
      );
    });

    it("drops an image whose bin item cannot be resolved, leaving no blank line", () => {
      const p = Paragraph.from(
        pic(`<hp:run>${PIC("missing")}<hp:t>text</hp:t></hp:run>`),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.toMarkdown()).toBe("text");
    });

    // Ownership: a pic under an hp:tc belongs to the CELL, not the paragraph.
    // Two paragraphs in chapter 07 hold both a table and a free pic, so an
    // "images or table" rule would either double-emit or drop.
    it("leaves an in-cell pic to the cell — emitted once, not twice", () => {
      const p = Paragraph.from(
        pic(
          `<hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run>` +
            PIC("image1") +
            `<hp:t>caption</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl></hp:run>`,
        ),
        undefined, BIN, undefined, undefined, "fx",
      );
      // The paragraph does not CLAIM it...
      expect(p.images).toHaveLength(0);
      // ...but the cell renders it, exactly once. Both halves matter: claiming
      // it here as well is precisely how it would be emitted twice.
      const out = String(p.toMarkdown());
      expect(out.match(/!\[\]\(fx\.assets\/fx-image1\.jpg\)/g)).toHaveLength(1);
      // And it reaches the asset manifest through the table, not the paragraph.
      expect(p.allImages().map(i => i.binItemId)).toEqual(["image1"]);
    });

    it("keeps a free pic in a paragraph that also holds a table", () => {
      const p = Paragraph.from(
        pic(
          `<hp:run>${PIC("image1")}<hp:tbl><hp:tr><hp:tc><hp:subList><hp:p>` +
            `<hp:run><hp:t>cell</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl></hp:run>`,
        ),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.images).toHaveLength(1);
      expect(String(p.toMarkdown())).toContain("![](fx.assets/fx-image1.jpg)");
    });

    // The gem pushes the image as its own content entry and THEN the sentinel,
    // giving `![](p)\n\n  - text` — the image above the bullet. Folding it into
    // `text` would give `- ![](p) text`, which is different bytes.
    it("carries the image above a list item rather than inside it", () => {
      const headerDoc = new DOMParser().parseFromString(
        `<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head">` +
          `<hh:paraPr id="7"><hh:heading type="BULLET" level="0" idRef="0"/></hh:paraPr>` +
          `</hh:head>`,
        "application/xml",
      );
      const doc = new DOMParser().parseFromString(
        `<hp:p ${NS} xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" paraPrIDRef="7">` +
          `<hp:run>${PIC("image1")}<hp:t>item</hp:t></hp:run></hp:p>`,
        "application/xml",
      );
      const p = Paragraph.from(
        doc.documentElement,
        undefined, BIN, undefined,
        headerDoc as unknown as Document,
        "fx",
      );
      const out = p.toMarkdown();
      expect(typeof out).not.toBe("string");
      expect(out).toMatchObject({
        type: "bullet_item",
        text: "item",
        imagePrefix: "![](fx.assets/fx-image1.jpg)",
      });
    });
  });

  // A paragraph's own content is what it OWNS. An hp:endNote hanging off it is a
  // separate body — the answer and worked solution of an exam item — and its
  // tables and figures belong to the note, not to the paragraph.
  //
  // Measured on a real 수능 paper before this scope existed: four stems per paper
  // were REPLACED by their endnote's sign table (the stem text discarded), and 39
  // of the file's 41 images were attributed to paragraphs, nearly all of them
  // living inside endnotes. Both are the descendant axis reaching where it should
  // not, the same shape as the caption and plate defects.
  describe("endnote content belongs to the endnote", () => {
    const BIN = new Map([["image1", { href: "BinData/image1.jpg" }]]);

    function withEndnote(inner: string) {
      const doc = new DOMParser().parseFromString(
        `<hp:p ${NS} xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core">${inner}</hp:p>`,
        "application/xml",
      );
      return doc.documentElement;
    }

    const ENDNOTE = (body: string): string =>
      `<hp:ctrl><hp:endNote number="7"><hp:subList><hp:p><hp:run>${body}` +
      `</hp:run></hp:p></hp:subList></hp:endNote></hp:ctrl>`;

    it("does not become a table paragraph because its endnote holds a table", () => {
      const p = Paragraph.from(
        withEndnote(
          `<hp:run>${ENDNOTE(`<hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run>` +
            `<hp:t>극대</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl>`)}` +
            `<hp:t>함수의 극솟값은?</hp:t></hp:run>`,
        ),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.table).toBeNull();
      expect(p.toMarkdown()).toBe("함수의 극솟값은?");
    });

    it("does not claim a figure that lives in its endnote", () => {
      const p = Paragraph.from(
        withEndnote(
          `<hp:run>${ENDNOTE(`<hp:pic><hc:img binaryItemIDRef="image1"/></hp:pic>`)}` +
            `<hp:t>그림과 같이</hp:t></hp:run>`,
        ),
        undefined, BIN, undefined, undefined, "fx",
      );
      expect(p.images).toHaveLength(0);
      expect(p.toMarkdown()).toBe("그림과 같이");
    });
  });
});
