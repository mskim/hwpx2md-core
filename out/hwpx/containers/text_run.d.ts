import type { CharPrTable } from "../ingest/styles";
/**
 * Wraps an hp:run element. Phase 2 exposed only concatenated text; Phase 4
 * adds `toMarkdown()` which applies inline Markdown style markers when the
 * caller passes a charPr lookup table to `from()`.
 *
 * Style ordering: if both bold and italic, emit `***text***` (outer triple).
 * If underline combines with any other style, underline wraps on the outside:
 *   bold + underline    → `<u>**text**</u>`
 *   italic + underline  → `<u>*text*</u>`
 *   all three           → `<u>***text***</u>`
 *
 * Styling combinations beyond bold/italic/underline are out of Phase 4 scope.
 */
export declare class TextRun {
    private readonly _texts;
    private readonly _style;
    private constructor();
    static from(node: Element, charPrTable?: CharPrTable): TextRun;
    /**
     * Joined with NOTHING.
     *
     * Hancom splits a run's text at styling and language boundaries, mid-word and
     * mid-sentence: "우리나" + "라는" is one word. Joining with "\n" put a line
     * break inside it, which a markdown renderer turns into a space — a visible
     * error in printed text.
     *
     * This used to join with "\n" and the test called it "Ruby parity". That was
     * half true and wholly misleading: the gem's TextRun#to_s does join with
     * "\n", but the gem's document walker never calls it — it concatenates a
     * run's hp:t directly, with no separator. The port mirrored a method the
     * reference implementation does not use on this path.
     *
     * Invisible for the parser's whole life: not one of the 17 fixtures had a run
     * with two hp:t in it, and the 추천사 paragraphs that do were being discarded
     * whole by the pic branch. Recovering them is what exposed this.
     */
    get text(): string;
    toMarkdown(): string;
}
