import type { Item } from "./item";
export interface ExamFrontMatter {
    readonly kind: "exam";
    readonly subject: string;
    readonly track: string;
    readonly source: string;
    /** quiz_maker requires it and no 수능 paper states it — supplied at import. */
    readonly grade?: string;
}
/**
 * One track's markdown, in the convention.
 *
 * Nothing here escapes: stems and explanations are built from `textContent` and
 * `MathNode`, neither of which routes through `escapeInline`. That is
 * deliberate — the shared escaper turns `[3점]` into `\[3점\]` and `[출제의도]`
 * into `\[출제의도\]`, which breaks the round-trip AND quiz_maker's
 * `Question.extract_intent`. Widening the escaper's exemptions would touch the
 * path three goldens depend on; emitting exam text unescaped does not.
 */
export declare function emitExam(front: ExamFrontMatter, items: readonly Item[]): string;
