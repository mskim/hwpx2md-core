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
      "| a | b |\n| --- | --- |\n| c | d |",
    );
  });

  it("delegates to ImageNode when paragraph wraps hp:pic and binItems is provided", () => {
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
});
