import { describe, expect, it } from "vitest";

import { normaliseLatex } from "../../../src/hwpx/exam/latex";

/**
 * Every input here is REAL converter output, generated from b3ed3d5c-3-09-2022.hwpx.
 * The previous plan's cases were typed from memory and several could never pass.
 */
describe("normaliseLatex", () => {
  const cases: [string, string][] = [
    ["$$\\mathrm {cos} \\, \\theta < 0$$", "$$\\cos\\theta<0$$"],
    ["$$a _ {8} +a _ {12} = \\it -6$$", "$$a_{8}+a_{12}=-6$$"],
    ["$$(1,~2)$$", "$$(1, 2)$$"],
    ["$$y=x ^ {3} -4x+5$$", "$$y=x^{3}-4x+5$$"],
    ["$$f \\, \\, : \\, \\rm X \\, \\, \\to \\, \\, X$$", "$$f: X \\to X$$"],
  ];

  for (const [input, expected] of cases) {
    it(`normalises ${input.slice(0, 34)}…`, () => {
      expect(normaliseLatex(input)).toBe(expected);
    });
  }

  it("leaves text outside $$…$$ alone", () => {
    expect(normaliseLatex("함수 $$x ^ {2}$$ 의 값은?")).toBe("함수 $$x^{2}$$ 의 값은?");
  });

  // A space after a macro is required only when a LETTER follows, or the macro
  // name absorbs it: `\to X` must keep its space, `\theta<0` must not.
  it("keeps the space a macro needs and drops the one it does not", () => {
    expect(normaliseLatex("$$\\alpha \\, \\beta$$")).toBe("$$\\alpha\\beta$$");
    expect(normaliseLatex("$$\\to \\, x$$")).toBe("$$\\to x$$");
  });

  // Inside \begin{cases} the thin spaces are the ONLY separator between Korean
  // words. Dropping them unconditionally yields 이홀수인경우. Assert on the
  // rendered words, not on the source — a per-word \text{} wrap would satisfy a
  // naive "does not contain 이홀수인" check while rendering exactly that.
  it("keeps Korean words separated", () => {
    const out = normaliseLatex("$$a _ {n} 이 \\, \\, \\, \\, 홀수인 \\, \\, \\, \\, 경우$$");
    const rendered = [...out.matchAll(/\\text\{([^}]*)\}/g)].map((m) => m[1]).join("");
    expect(rendered).toContain("이 홀수인 경우");
  });
});
