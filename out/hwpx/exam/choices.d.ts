/** One option of a multiple-choice item. `index` is what `### 정답` will hold. */
export interface Choice {
    readonly index: number;
    readonly text: string;
}
/**
 * The choices in one paragraph, or null if this is not a choice paragraph.
 *
 * A 수능 paper lays five choices across the print column, so they arrive split
 * over more than one paragraph — 3+2 is the common shape but 1+1+1+1+1, 2+2+1
 * and all-five each occur. The caller accumulates until it has five.
 *
 * Requiring the paragraph to BEGIN with a circled numeral is what keeps a stem
 * out: one in the corpus carries a ② part way through its sentence, and
 * splitting on ①-⑤ wherever they appear would tear that question in half.
 */
export declare function extractChoices(paragraph: string): Choice[] | null;
/**
 * A figure sitting ahead of the first choice, and the text after it.
 *
 * A question's diagram often shares the paragraph that opens the choices, so
 * the emitted markdown reads `![](…)\n\n① $$-4$$`. Requiring the paragraph to
 * begin with a circled numeral would reject those — 3 to 4 items per paper —
 * and their choices would then arrive numbered 2,3,4,5.
 *
 * Returned rather than discarded: the figure belongs to the item, and the
 * assembler attaches it to the stem.
 */
export declare function splitLeadingFigure(paragraph: string): {
    figure: string | null;
    rest: string;
};
