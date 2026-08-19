import { describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";

import { parseAnswerKey } from "../../../src/hwpx/exam/answer_key";

const NS = `xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"`;

const cell = (text: string, span = 1): string =>
  `<hp:tc><hp:cellSpan colSpan="${span}" rowSpan="1"/><hp:subList><hp:p><hp:run>` +
  `<hp:t>${text}</hp:t></hp:run></hp:p></hp:subList></hp:tc>`;
const row = (cells: string[]): string => `<hp:tr>${cells.join("")}</hp:tr>`;

/** Mirrors the real key table of b3ed3d5c: 공통 pairs, then one row per elective. */
function parseKeyTable() {
  const doc = new DOMParser().parseFromString(
    `<hp:p ${NS}><hp:run><hp:tbl>` +
      row([cell("1"), cell("④"), cell("2"), cell("①")]) +
      row([cell("21"), cell("220"), cell("22"), cell("58"), cell("", 6)]) +
      row([cell("확률과통계", 4), cell("23"), cell("①"), cell("24"), cell("③")]) +
      row([cell("미적분", 4), cell("23"), cell("①"), cell("24"), cell("②")]) +
      row([cell("기하", 4), cell("23"), cell("④"), cell("24"), cell("②")]) +
      // A labelled row carries only 23-25; the NEXT row continues the same
      // elective with 26-30 and carries no label of its own.
      row([cell("26"), cell("③"), cell("27"), cell("③")]) +
      `</hp:tbl></hp:run></hp:p>`,
    "application/xml",
  );
  return parseAnswerKey(doc.documentElement);
}

describe("parseAnswerKey", () => {
  it("reads 공통 answers from rows with no track label", () => {
    const key = parseAnswerKey0();
    expect(key.get("공통")?.get(1)).toBe("4");
    expect(key.get("공통")?.get(2)).toBe("1");
  });

  it("keeps 단답형 answers as their integer", () => {
    const key = parseAnswerKey0();
    expect(key.get("공통")?.get(21)).toBe("220");
    expect(key.get("공통")?.get(22)).toBe("58");
  });

  // The three electives share numbers 23-30, so the track is what makes an
  // answer identifiable at all.
  it("keeps each elective's answers apart", () => {
    const key = parseAnswerKey0();
    expect(key.get("확률과통계")?.get(23)).toBe("1");
    expect(key.get("미적분")?.get(23)).toBe("1");
    expect(key.get("기하")?.get(23)).toBe("4");
    expect(key.get("기하")?.get(24)).toBe("2");
  });

  it("continues an elective onto the unlabelled row that follows it", () => {
    const key = parseAnswerKey0();
    expect(key.get("기하")?.get(26)).toBe("3");
    expect(key.get("기하")?.get(27)).toBe("3");
    expect(key.get("공통")?.has(26)).toBe(false);
  });

  it("returns null when the document has no key table", () => {
    const doc = new DOMParser().parseFromString(
      `<hp:p ${NS}><hp:run><hp:t>보통 문단</hp:t></hp:run></hp:p>`,
      "application/xml",
    );
    expect(parseAnswerKey(doc.documentElement)).toBeNull();
  });

  function parseAnswerKey0() {
    const key = parseKeyTable();
    if (!key) throw new Error("no key table found");
    return key;
  }
});
