import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { TextRun } from "../../../src/hwpx/containers/text_run";

const NS = 'xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"';

function parseRun(xml: string) {
  const doc = new DOMParser().parseFromString(
    `<hp:run ${NS}>${xml}</hp:run>`,
    "application/xml",
  );
  return doc.documentElement;
}

describe("TextRun", () => {
  it("extracts the text of a single hp:t child", () => {
    const run = TextRun.from(parseRun(`<hp:t>hello</hp:t>`));
    expect(run.text).toBe("hello");
  });

  // Hancom splits a run at styling and language boundaries, mid-word: the
  // reference manuscript has "우리나" + "라는", one word in two hp:t. This
  // previously joined with "\n" and called it "Ruby parity" — the gem's
  // TextRun#to_s does that, but its document walker never calls it and
  // concatenates directly instead.
  it("joins multiple hp:t children with NOTHING, never a newline", () => {
    const run = TextRun.from(
      parseRun(`<hp:t>first</hp:t><hp:t>second</hp:t>`),
    );
    expect(run.text).toBe("firstsecond");
  });

  it("does not break a word split across two hp:t", () => {
    const run = TextRun.from(parseRun(`<hp:t>우리나</hp:t><hp:t>라는</hp:t>`));
    expect(run.text).toBe("우리나라는");
  });

  it("returns empty string for a run with no hp:t children", () => {
    const run = TextRun.from(parseRun(``));
    expect(run.text).toBe("");
  });

  it("toMarkdown() returns unstyled text when no charPr table is provided", () => {
    const run = TextRun.from(parseRun(`<hp:t>hello</hp:t>`));
    expect(run.toMarkdown()).toBe("hello");
  });

  it("toMarkdown() wraps bold runs in **", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:run ${ns} charPrIDRef="7"><hp:t>bold text</hp:t></hp:run>`,
      "application/xml",
    );
    const table = new Map([["7", { bold: true, italic: false, underline: false, strikethrough: false, supscript: false, subscript: false }]]);
    const run = TextRun.from(doc.documentElement, table);
    expect(run.toMarkdown()).toBe("**bold text**");
  });

  it("toMarkdown() wraps italic runs in *", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:run ${ns} charPrIDRef="8"><hp:t>italic text</hp:t></hp:run>`,
      "application/xml",
    );
    const table = new Map([["8", { bold: false, italic: true, underline: false, strikethrough: false, supscript: false, subscript: false }]]);
    const run = TextRun.from(doc.documentElement, table);
    expect(run.toMarkdown()).toBe("*italic text*");
  });

  it("toMarkdown() wraps bold+italic runs in ***", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:run ${ns} charPrIDRef="9"><hp:t>both</hp:t></hp:run>`,
      "application/xml",
    );
    const table = new Map([["9", { bold: true, italic: true, underline: false, strikethrough: false, supscript: false, subscript: false }]]);
    const run = TextRun.from(doc.documentElement, table);
    expect(run.toMarkdown()).toBe("***both***");
  });

  it("toMarkdown() wraps underline runs in <u>", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:run ${ns} charPrIDRef="10"><hp:t>underlined</hp:t></hp:run>`,
      "application/xml",
    );
    const table = new Map([["10", { bold: false, italic: false, underline: true, strikethrough: false, supscript: false, subscript: false }]]);
    const run = TextRun.from(doc.documentElement, table);
    expect(run.toMarkdown()).toBe("<u>underlined</u>");
  });

  it("toMarkdown() returns empty string for an empty run even with styles set", () => {
    const ns = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;
    const doc = new DOMParser().parseFromString(
      `<hp:run ${ns} charPrIDRef="7"/>`,
      "application/xml",
    );
    const table = new Map([["7", { bold: true, italic: true, underline: true, strikethrough: false, supscript: false, subscript: false }]]);
    const run = TextRun.from(doc.documentElement, table);
    expect(run.toMarkdown()).toBe("");
  });

  // An hp:pic carries its caption at hp:pic > hp:caption > hp:subList > hp:p >
  // hp:run > hp:t. `.//hp:t` reaches it, which splices the caption into the
  // middle of the sentence the image sits beside:
  //   "…훌륭한 우리나" + "이 태 섭" + "라는 고조선(古朝鮮)에 이어…"
  // Caption text belongs to the image, as alt text, and nowhere else.
  it("does not descend into an hp:pic caption", () => {
    const run = TextRun.from(
      parseRun(
        `<hp:t>대한민국은 우리나</hp:t>` +
          `<hp:pic><hp:caption><hp:subList><hp:p><hp:run><hp:t>이 태 섭</hp:t></hp:run></hp:p></hp:subList></hp:caption></hp:pic>` +
          `<hp:t>라는 고조선에 이어</hp:t>`,
      ),
    );
    // Both fixes together: the caption is gone AND the word it was wedged
    // into is whole again.
    expect(run.text).toBe("대한민국은 우리나라는 고조선에 이어");
  });
});
