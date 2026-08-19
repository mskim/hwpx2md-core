import { describe, expect, it } from "vitest";

import { extractChoices, splitLeadingFigure } from "../../../src/hwpx/exam/choices";

describe("extractChoices", () => {
  it("splits a circle-first paragraph", () => {
    expect(extractChoices("① $$8$$② $$9$$③ $$10$$")).toEqual([
      { index: 1, text: "$$8$$" },
      { index: 2, text: "$$9$$" },
      { index: 3, text: "$$10$$" },
    ]);
  });

  it("reads the continuation paragraph, which starts mid-run", () => {
    expect(extractChoices("④ $$11$$⑤ $$12$$")).toEqual([
      { index: 4, text: "$$11$$" },
      { index: 5, text: "$$12$$" },
    ]);
  });

  // Real shape from b3ed3d5c and 0d6ba818: the whole line is bold, and a naive
  // split leaves the closing ** on the last choice.
  it("strips a wrapping bold and does not leave it on the last choice", () => {
    expect(extractChoices("**① ㄱ② ㄱ, ㄴ③ ㄱ, ㄷ**")).toEqual([
      { index: 1, text: "ㄱ" },
      { index: 2, text: "ㄱ, ㄴ" },
      { index: 3, text: "ㄱ, ㄷ" },
    ]);
  });

  // The false positive that matters: a STEM containing a circled numeral part
  // way through. 0d6ba818 has one. Splitting on ①-⑤ anywhere would tear the
  // question in half.
  it("refuses a stem that merely contains a circled numeral", () => {
    expect(
      extractChoices("그림과 같이 사각형 $$\\rm ABCD$$가 한 원에 내접하고 ② 를 만족한다"),
    ).toBeNull();
  });

  // A question's diagram often shares the paragraph that opens the choices.
  // Rejecting those cost 3-4 items per paper, whose choices then arrived
  // numbered 2,3,4,5 — found by asserting on counts, not on values.
  it("reads choices that follow a leading figure", () => {
    expect(extractChoices("![](m.assets/m-image2.png)\n\n① $$-4$$")).toEqual([
      { index: 1, text: "$$-4$$" },
    ]);
  });

  it("returns the leading figure rather than discarding it", () => {
    const { figure, rest } = splitLeadingFigure("![](m.assets/m-image2.png)\n\n① $$-4$$");
    expect(figure).toBe("![](m.assets/m-image2.png)");
    expect(rest).toBe("① $$-4$$");
  });

  it("refuses ordinary prose", () => {
    expect(extractChoices("함수 $$f(x)$$의 값은?")).toBeNull();
  });

  it("refuses an empty paragraph", () => {
    expect(extractChoices("   ")).toBeNull();
  });
});
