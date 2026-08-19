import { describe, expect, it } from "vitest";

import { emitExam, type ExamFrontMatter } from "../../../src/hwpx/exam/emit";
import type { Item } from "../../../src/hwpx/exam/item";

const FRONT: ExamFrontMatter = {
  kind: "exam",
  subject: "수학",
  track: "미적분",
  source: "2022-11 실전",
};

const item = (over: Partial<Item> = {}): Item => ({
  number: 23,
  stem: "곡선 $$y=x^{3}$$ 위의 점에서의 접선은?",
  figures: [],
  choices: [
    { index: 1, text: "$$y=-3x+3$$" },
    { index: 2, text: "$$y=-3x+2$$" },
  ],
  type: "multiple_choice",
  points: null,
  answer: "2",
  explanation: "$$f'(x)=3x^{2}$$이므로",
  mismatch: null,
  images: [],
  ...over,
});

describe("emitExam", () => {
  it("writes the convention", () => {
    expect(emitExam(FRONT, [item()])).toBe(
      `---
kind: exam
subject: 수학
track: 미적분
source: 2022-11 실전
---

## 23

곡선 $$y=x^{3}$$ 위의 점에서의 접선은?

1. $$y=-3x+3$$
2. $$y=-3x+2$$

### 정답

2

### 해설

> $$f'(x)=3x^{2}$$이므로
`,
    );
  });

  it("writes 배점 into the heading only when the paper prints one", () => {
    expect(emitExam(FRONT, [item({ points: 4 })])).toContain("## 23  [4점]");
    expect(emitExam(FRONT, [item()])).toContain("## 23\n");
  });

  it("omits the choices list for 단답형, so the type is derivable", () => {
    const md = emitExam(FRONT, [item({ type: "short_answer", choices: [], answer: "80" })]);
    expect(md).not.toMatch(/^\d\. /m);
    expect(md).toContain("### 정답\n\n80");
  });

  it("keeps a question's figures", () => {
    expect(emitExam(FRONT, [item({ figures: ["![](x.assets/x-image2.png)"] })]))
      .toContain("![](x.assets/x-image2.png)");
  });

  // The 해설 carries 27 equations on average. A fenced code block would render
  // every one of them as literal text.
  it("quotes the 해설 rather than fencing it", () => {
    const md = emitExam(FRONT, [item()]);
    expect(md).toContain("> $$f'(x)=3x^{2}$$이므로");
    expect(md).not.toContain("```");
  });

  it("emits nothing that the markdown escaper would have mangled", () => {
    const md = emitExam(FRONT, [item({ explanation: "[출제의도] 접선의 방정식" })]);
    expect(md).toContain("[출제의도]");
    expect(md).not.toContain("\\[");
  });

  it("grade appears only when supplied", () => {
    expect(emitExam({ ...FRONT, grade: "고3" }, [item()])).toContain("grade: 고3");
    expect(emitExam(FRONT, [item()])).not.toContain("grade:");
  });
});
