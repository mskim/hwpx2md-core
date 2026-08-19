#!/usr/bin/env node
/**
 * Acceptance for the 수학 exam emitter, against real 수능 papers.
 *
 * A SCRIPT rather than a vitest test because its inputs cannot be committed:
 * Korean 기출 (평가원/교육청/EBS/수능) carry usage terms, and quiz_maker_math's
 * own PRD says they must not be published until redistribution rights are
 * verified. So the unit tests use inline XML, and this runs against the corpus
 * on the machine that has it.
 *
 *   CORPUS=~/Development/hwpx_sample_files/by-exam/수학 node scripts/exam-acceptance.mjs
 *
 * Exits non-zero on any failure.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { ExamPaper } = await import(path.join(HERE, "..", "out", "hwpx", "exam", "paper.js"));

const CORPUS =
  process.env.CORPUS ??
  path.join(process.env.HOME ?? "", "Development/hwpx_sample_files/by-exam/수학");

/** The four DISTINCT papers; the other nine files are layout variants of one. */
const PAPERS = {
  "b3ed3d5c-3-09-2022.hwpx": "2022-09 교육",
  "9ff4ba0f-3-09-2023.hwpx": "2023-09 교육",
  "f3724621-3-10-2022.hwpx": "2022-10 교육",
  "0d6ba818-3-11-2024-20-7-2.hwpx": "2022-11 실전",
};

/**
 * Answers where the paper DISAGREES WITH ITSELF — its printed key and its own
 * endnote give different values. Genuine source conflicts, not parser bugs.
 * A third one appearing means something changed and must be looked at.
 */
const KNOWN_CONFLICTS = new Set([
  "2022-09 교육|미적분|30", // key 383, endnote 283
  "2022-11 실전|기하|29", // key 12,  endnote 6
]);

const EXPECTED = { 공통: 22, 확률과통계: 8, 미적분: 8, 기하: 8 };
const MIN_EXPLANATION_EQUATIONS = 4500; // measured 4,867 in the source

const failures = [];
const fail = (m) => failures.push(m);

if (!fs.existsSync(CORPUS)) {
  console.error(`corpus not found: ${CORPUS}\nSet CORPUS= to the 수학 sample directory.`);
  process.exit(2);
}

let totalItems = 0;
let totalEquations = 0;
let totalConflicts = 0;

for (const [file, source] of Object.entries(PAPERS)) {
  const full = path.join(CORPUS, file);
  if (!fs.existsSync(full)) {
    fail(`${file}: missing from the corpus`);
    continue;
  }
  const files = await ExamPaper.open(fs.realpathSync(full), { source, grade: "고3" });

  if (files.length !== 4) fail(`${source}: ${files.length} files, expected 4`);

  for (const f of files) {
    if (f.items.length !== EXPECTED[f.track]) {
      fail(`${source} ${f.track}: ${f.items.length} items, expected ${EXPECTED[f.track]}`);
    }
    if (/\\\[|\\\]/.test(f.markdown)) fail(`${source} ${f.track}: emitted an escaped bracket`);
    if (!f.markdown.startsWith("---\nkind: exam\n")) fail(`${source} ${f.track}: no front matter`);

    const numbers = f.items.map((i) => i.number);
    const expected =
      f.track === "공통"
        ? Array.from({ length: 22 }, (_, i) => i + 1)
        : Array.from({ length: 8 }, (_, i) => i + 23);
    if (numbers.join(",") !== expected.join(",")) {
      fail(`${source} ${f.track}: numbers ${numbers.join(",")}`);
    }

    for (const item of f.items) {
      totalItems++;
      const where = `${source} ${f.track} ${item.number}`;
      if (item.stem.trim() === "") fail(`${where}: empty stem`);
      if (item.explanation.trim() === "") fail(`${where}: empty 해설`);
      if (item.answer.trim() === "") fail(`${where}: no answer`);

      if (item.type === "multiple_choice") {
        if (item.choices.length !== 5) fail(`${where}: ${item.choices.length} choices`);
        if (item.choices.some((c, i) => c.index !== i + 1)) {
          fail(`${where}: choices ${item.choices.map((c) => c.index).join(",")}`);
        }
        if (!/^[1-5]$/.test(item.answer)) fail(`${where}: MC answer ${item.answer}`);
      } else if (item.choices.length > 0) {
        fail(`${where}: 단답형 with ${item.choices.length} choices`);
      }

      if (item.mismatch) {
        totalConflicts++;
        const key = `${source}|${f.track}|${item.number}`;
        if (!KNOWN_CONFLICTS.has(key)) fail(`${where}: NEW answer conflict — ${item.mismatch}`);
      }
      totalEquations += (item.explanation.match(/\$\$/g) ?? []).length / 2;
    }
  }
  const n = files.reduce((a, f) => a + f.items.length, 0);
  console.log(`  ${source.padEnd(14)} 4 files, ${n} items`);
}

if (totalItems !== 184) fail(`${totalItems} items across the four papers, expected 184`);
if (totalEquations < MIN_EXPLANATION_EQUATIONS) {
  fail(`${totalEquations} equations in explanations, expected at least ${MIN_EXPLANATION_EQUATIONS}`);
}

console.log(
  `\n  items ${totalItems}   explanation equations ${totalEquations}   ` +
    `answer conflicts ${totalConflicts} (${KNOWN_CONFLICTS.size} known)`,
);

if (failures.length > 0) {
  console.error(`\n${failures.length} FAILURES:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nOK — exam acceptance clean.");
