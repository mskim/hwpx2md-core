import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { assembleItems, stemMarkdown, type SourceParagraph } from "../../../src/hwpx/exam/item";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function p(inner: string) {
  const doc = new DOMParser().parseFromString(`<hp:p ${NS}>${inner}</hp:p>`, "application/xml");
  return doc.documentElement;
}
const note = (n: number, body: string): string =>
  `<hp:ctrl><hp:endNote number="${n}"><hp:subList><hp:p><hp:run><hp:t>${body}</hp:t>` +
  `</hp:run></hp:p></hp:subList></hp:endNote></hp:ctrl>`;
const src = (node: Element, markdown: string): SourceParagraph => ({ node, markdown });

describe("stemMarkdown", () => {
  it("interleaves text and equations in document order", () => {
    const out = stemMarkdown(
      p(`<hp:run><hp:t>함수</hp:t>` +
        `<hp:equation><hp:script>f(x)=2x ^{2}</hp:script></hp:equation>` +
        `<hp:t>의 값은?</hp:t></hp:run>`),
    );
    expect(out).toBe("함수$$f(x)=2x^{2}$$의 값은?");
  });

  // Item 1's stem sits beside the masthead TABLE. Paragraph.toMarkdown()'s table
  // branch returns before the equation branch, so it emitted only "의 값은?" —
  // and it rendered the masthead, which is running-head furniture.
  it("keeps the stem's equation and leaves the masthead table out", () => {
    const out = stemMarkdown(
      p(`<hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run>` +
        `<hp:t>수능 모의고사</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr></hp:tbl>` +
        `<hp:equation><hp:script>2 ^{3}</hp:script></hp:equation>` +
        `<hp:t>의 값은?</hp:t></hp:run>`),
    );
    expect(out).toBe("$$2^{3}$$의 값은?");
    expect(out).not.toContain("수능");
  });

  it("leaves the endnote's own content out of the stem", () => {
    const out = stemMarkdown(p(`<hp:run>${note(3, "④풀이")}<hp:t>문제</hp:t></hp:run>`));
    expect(out).toBe("문제");
  });
});

describe("assembleItems", () => {
  const key = (n: number): string | undefined => ({ 1: "4", 2: "1" })[n];

  it("opens an item at a paragraph bearing an endnote", () => {
    const items = assembleItems(
      [
        src(p(`<hp:run>${note(1, "④풀이")}<hp:t>첫 문제</hp:t></hp:run>`), "첫 문제"),
        src(p(`<hp:run><hp:t>① 가② 나③ 다④ 라⑤ 마</hp:t></hp:run>`), "① 가② 나③ 다④ 라⑤ 마"),
        src(p(`<hp:run>${note(2, "①다른 풀이")}<hp:t>둘째 문제</hp:t></hp:run>`), "둘째 문제"),
      ],
      key,
    );
    expect(items).toHaveLength(2);
    expect(items[0]!.number).toBe(1);
    expect(items[0]!.stem).toBe("첫 문제");
    expect(items[0]!.choices).toHaveLength(5);
    expect(items[0]!.type).toBe("multiple_choice");
    expect(items[0]!.answer).toBe("4");
  });

  it("calls an item with no choices short_answer", () => {
    const items = assembleItems(
      [src(p(`<hp:run>${note(1, "④풀이")}<hp:t>값을 구하시오</hp:t></hp:run>`), "값을 구하시오")],
      () => "80",
    );
    expect(items[0]!.type).toBe("short_answer");
    expect(items[0]!.choices).toHaveLength(0);
  });

  // One item in the corpus glues choice ① to the end of its stem paragraph, so
  // the recognised run starts at ②. Emitting four choices numbered 2-5 would be
  // worse than either extreme.
  it("recovers a first choice glued to the end of the stem", () => {
    const items = assembleItems(
      [
        src(p(`<hp:run>${note(1, "④풀이")}<hp:t>반지름의 길이는?① 가</hp:t></hp:run>`),
            "반지름의 길이는?① 가"),
        src(p(`<hp:run><hp:t>② 나③ 다④ 라⑤ 마</hp:t></hp:run>`), "② 나③ 다④ 라⑤ 마"),
      ],
      key,
    );
    expect(items[0]!.stem).toBe("반지름의 길이는?");
    expect(items[0]!.choices.map((c) => c.index)).toEqual([1, 2, 3, 4, 5]);
  });
});
