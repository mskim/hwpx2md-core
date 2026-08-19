import { describe, expect, it } from "vitest";

import { splitAnswerAndExplanation } from "../../../src/hwpx/exam/answer";

/** Every body below is real EndNote output, generated from the corpus. */
describe("splitAnswerAndExplanation", () => {
  it("reads a bare circled answer", () => {
    const r = splitAnswerAndExplanation(" ④$$(\\dfrac{2}{2})$$", { type: "multiple_choice" });
    expect(r.answer).toBe("4");
    expect(r.explanation).toBe("$$(\\dfrac{2}{2})$$");
  });

  it("strips the underscore-style source label", () => {
    const r = splitAnswerAndExplanation(" 22_11_실전 2) ④주어진 식의 분모", {
      type: "multiple_choice",
    });
    expect(r.answer).toBe("4");
    expect(r.explanation).toBe("주어진 식의 분모");
  });

  // 9ff4ba0f writes the label with a SPACE where the others use an underscore.
  // A pattern requiring `\d{2}_\d{2}_` misses all 46 of that paper's endnotes.
  it("strips the space-style source label", () => {
    const r = splitAnswerAndExplanation(" 23_09 교육 1) ⑤$$3^{1}$$", {
      type: "multiple_choice",
    });
    expect(r.answer).toBe("5");
    expect(r.explanation).toBe("$$3^{1}$$");
  });

  it("strips a label whose number is missing", () => {
    const r = splitAnswerAndExplanation(" 23_09 교육 ) ②풀이", { type: "multiple_choice" });
    expect(r.answer).toBe("2");
  });

  // THE undecidable case. After the label this reads `100$$f(6)=f(5)+6$$이므로`,
  // which parses as 1, 10 or 100. The printed key decides; the body is then
  // only a cross-check.
  it("takes a 단답형 answer from the key, never from the text", () => {
    const r = splitAnswerAndExplanation(" 22_11_실전 30) 100$$f(6)=f(5)+6$$이므로", {
      type: "short_answer",
      keyed: "100",
    });
    expect(r.answer).toBe("100");
    expect(r.explanation).toBe("$$f(6)=f(5)+6$$이므로");
    expect(r.mismatch).toBeNull();
  });

  it("keeps the explanation's opening equation", () => {
    const r = splitAnswerAndExplanation(" 23_09 교육 16) 6$$\\log_{2} (x-1)$$에서 로그의", {
      type: "short_answer",
      keyed: "6",
    });
    expect(r.answer).toBe("6");
    expect(r.explanation.startsWith("$$\\log_{2} (x-1)$$")).toBe(true);
  });

  // A disagreement is reported, never resolved silently — the corpus has two
  // genuine ones, where the printed key and the endnote body differ in source.
  it("reports a mismatch rather than choosing", () => {
    const r = splitAnswerAndExplanation(" 22_11_실전 30) 283$$f(6)$$", {
      type: "short_answer",
      keyed: "383",
    });
    expect(r.answer).toBe("383");
    expect(r.mismatch).toContain("283");
  });

  // Two items store the answer digits in an hp:equation, so the body reads
  // `$$127$$` rather than `127`. Matching only bare digits reported those as
  // unverifiable — a false alarm on a correct item.
  it("reads an answer that HWP stored as an equation", () => {
    const r = splitAnswerAndExplanation(" ![](x.assets/x-image36.jpg)$$127$$[출제의도] 좌표공간", {
      type: "short_answer",
      keyed: "127",
    });
    expect(r.answer).toBe("127");
    expect(r.mismatch).toBeNull();
    expect(r.explanation.startsWith("[출제의도]")).toBe(true);
  });

  it("reads the explicitly labelled [정답] / [해설] form", () => {
    const r = splitAnswerAndExplanation(" [정답] $$24$$[해설]$$\\sum_{k=1}^{10}$$", {
      type: "short_answer",
      keyed: "24",
    });
    expect(r.answer).toBe("24");
    expect(r.mismatch).toBeNull();
    expect(r.explanation).toBe("$$\\sum_{k=1}^{10}$$");
  });

  it("reports a multiple-choice body with no circled answer", () => {
    const r = splitAnswerAndExplanation(" 풀이만 있고 답이 없다", { type: "multiple_choice" });
    expect(r.answer).toBe("");
    expect(r.mismatch).not.toBeNull();
  });
});
