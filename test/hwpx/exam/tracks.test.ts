import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { splitByTrack } from "../../../src/hwpx/exam/tracks";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

function paras(...texts: string[]) {
  const doc = new DOMParser().parseFromString(
    `<hs:sec ${NS} xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">` +
      texts.map((t) => `<hp:p><hp:run><hp:t>${t}</hp:t></hp:run></hp:p>`).join("") +
      `</hs:sec>`,
    "application/xml",
  );
  return Array.from(doc.documentElement.childNodes).filter(
    (n) => n.nodeType === 1,
  ) as Element[];
}

describe("splitByTrack", () => {
  it("puts everything before the first divider in 공통", () => {
    const out = splitByTrack(paras("문제1", "문제2", " 확률과 통계  ", "문제23"));
    expect(out.map((g) => g.track)).toEqual(["공통", "확률과통계", "미적분", "기하"]);
    expect(out[0]!.nodes).toHaveLength(2);
  });

  it("does not include the divider itself in the elective's paragraphs", () => {
    const out = splitByTrack(paras("문제1", " 미적분  ", "문제23", "문제24"));
    const mi = out.find((g) => g.track === "미적분")!;
    expect(mi.nodes).toHaveLength(2);
  });

  // The divider spells it 확률과 통계 WITH a space; the answer-key table spells
  // it 확률과통계 without one. Comparing with whitespace stripped handles both,
  // and a pattern shared with the key parser would fail on every file.
  it("matches the spaced divider spelling", () => {
    const out = splitByTrack(paras(" 확률과 통계  ", "문제23"));
    expect(out.find((g) => g.track === "확률과통계")!.nodes).toHaveLength(1);
  });

  // A real paper has SIX divider paragraphs: three opening the elective
  // sections, three more clustered by the printed answer key at the end.
  it("takes the first three dividers and ignores the later cluster", () => {
    const out = splitByTrack(
      paras("공통", " 확률과 통계  ", "가", " 미적분  ", "나", " 기하  ", "다",
            " 확률과 통계  ", " 미적분  ", " 기하  "),
    );
    expect(out.find((g) => g.track === "기하")!.nodes.map((n) => n.textContent?.trim()))
      .toEqual(["다", "확률과 통계", "미적분", "기하"]);
  });
});
