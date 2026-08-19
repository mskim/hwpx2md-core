export interface AnswerSplit {
    readonly answer: string;
    readonly explanation: string;
    /** Set when the body disagrees with the key, or carries no answer at all. */
    readonly mismatch: string | null;
}
export interface SplitOptions {
    readonly type: "multiple_choice" | "short_answer";
    /** The printed key's answer. Authoritative for 단답형. */
    readonly keyed?: string;
}
/**
 * Separates an item's answer from its worked solution.
 *
 * There is no separator in the source: the answer runs straight into the 해설.
 * For multiple choice the leading ①-⑤ is an unambiguous boundary. For 단답형 it
 * is undecidable from the text — `30) 100이므로` parses as 1, 10 or 100 — so the
 * printed answer key decides and the body serves only as a cross-check.
 *
 * A disagreement is REPORTED, never resolved silently. The corpus contains two
 * genuine ones where the paper's own key and its endnote differ.
 */
export declare function splitAnswerAndExplanation(body: string, opts: SplitOptions): AnswerSplit;
