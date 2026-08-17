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
    get text(): string;
    toMarkdown(): string;
}
