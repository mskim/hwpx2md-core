/// <reference lib="dom" />

import { findAll } from "../ingest/xml";

/** track → problem number → answer, `"1"`–`"5"` for MC or the integer for 단답형. */
export type AnswerKey = ReadonlyMap<string, ReadonlyMap<number, string>>;

/**
 * The answer key printed in the paper's own body.
 *
 * Every 수능 paper carries one, and it is the authority for 단답형 answers: the
 * endnote body runs the answer straight into the 해설 with no separator, so
 * `30) 100이므로` parses as 1, 10 or 100. The key decides; the body then serves
 * as an independent cross-check.
 *
 * NOTE the spelling. The key table writes `확률과통계` with NO space, while the
 * body track dividers write `확률과 통계` WITH one. They cannot share a pattern.
 */
const TRACKS = ["확률과통계", "미적분", "기하"];
const COMMON = "공통";
const CIRCLED = "①②③④⑤";

export function parseAnswerKey(scope: Document | Element): AnswerKey | null {
  const table = findAll(scope, ".//hp:tbl").find(t => {
    const text = cellTexts(t).join("");
    return TRACKS.every(name => text.includes(name));
  });
  if (!table) return null;

  const key = new Map<string, Map<number, string>>([[COMMON, new Map()]]);
  for (const name of TRACKS) key.set(name, new Map());

  // A LABELLED row opens an elective and carries only 23-25; the row after it
  // continues the same elective with 26-30 and carries no label. Treating every
  // unlabelled row as 공통 gives 공통 27 answers and each elective 3 — which is
  // what the first version of this did.
  let current = COMMON;

  for (const tr of findAll(table, "hp:tr")) {
    const cells = findAll(tr, "hp:tc").map(textOf);
    const label = TRACKS.find(name => cells[0]?.replace(/\s/g, "") === name);
    if (label) current = label;
    const pairs = label ? cells.slice(1) : cells;
    const target = key.get(current)!;

    for (let i = 0; i + 1 < pairs.length; i += 2) {
      const num = parseInt(pairs[i] ?? "", 10);
      const answer = normaliseAnswer(pairs[i + 1] ?? "");
      if (Number.isNaN(num) || answer === "") continue;
      target.set(num, answer);
    }
  }
  return key;
}

/** ①–⑤ become the list index a reader would type; 단답형 integers stay. */
function normaliseAnswer(raw: string): string {
  const t = raw.trim();
  const circled = CIRCLED.indexOf(t);
  if (circled >= 0) return String(circled + 1);
  return /^\d+$/.test(t) ? t : "";
}

function textOf(tc: Element): string {
  return findAll(tc, ".//hp:t").map(t => t.textContent ?? "").join("").trim();
}

function cellTexts(table: Element): string[] {
  return findAll(table, ".//hp:tc").map(textOf);
}
