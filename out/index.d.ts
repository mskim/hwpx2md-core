import type { Converter } from "./types";
export declare function createHwpxConverter(): Converter;
export { Document } from "./hwpx/document";
/**
 * The exam API. A 수능 수학 .hwpx holds 공통 plus three electives — 46 items in
 * one file, with 23-30 appearing three times — so it converts to FOUR markdown
 * files rather than one, in the exam convention:
 *
 *   const files = await ExamPaper.open(path, { source: "2022-11 실전" });
 *   files[0].filename   // 2022-11-실전-공통.md
 *   files[0].markdown   // front matter, ## <n>, choices, ### 정답, ### 해설
 *
 * See docs/superpowers/specs/2026-08-19-markdown-exam-convention-design.md in
 * the wehangul repo.
 */
export { ExamPaper } from "./hwpx/exam/paper";
export type { ExamFile, OpenOptions as ExamOpenOptions } from "./hwpx/exam/paper";
export type { Item as ExamItem } from "./hwpx/exam/item";
export type { Choice as ExamChoice } from "./hwpx/exam/choices";
export type { ExamFrontMatter } from "./hwpx/exam/emit";
export { TRACKS as EXAM_TRACKS } from "./hwpx/exam/tracks";
export type { Track as ExamTrack } from "./hwpx/exam/tracks";
/** Exposed so a caller can normalise LaTeX a teacher typed, not only converted. */
export { normaliseLatex } from "./hwpx/exam/latex";
export { ConversionError } from "./types";
export type { Asset, ConversionResult, Converter } from "./types";
