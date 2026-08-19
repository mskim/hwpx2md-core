import { ImageNode } from "../containers/image_node";
import type { BinItemTable } from "../ingest/bin_items";
import { type Choice } from "./choices";
export interface Item {
    readonly number: number;
    readonly stem: string;
    readonly figures: string[];
    readonly choices: Choice[];
    readonly type: "multiple_choice" | "short_answer";
    readonly answer: string;
    readonly explanation: string;
    readonly mismatch: string | null;
    readonly images: ImageNode[];
}
/**
 * A paragraph's own prose, with its equations in place.
 *
 * Built from the NODE rather than `Paragraph.toMarkdown()`, which cannot serve
 * here for two reasons. Its table branch returns before the equation branch, so
 * item 1 — whose stem sits beside the masthead table — loses its equation and
 * emits only "의 값은?". And it renders the masthead table itself, which is
 * running-head furniture rather than part of the question.
 */
export declare function stemMarkdown(node: Element): string;
export interface SourceParagraph {
    readonly node: Element;
    /** Emitted markdown, used to recognise choice paragraphs. */
    readonly markdown: string;
}
/**
 * Groups a track's paragraphs into items.
 *
 * An item opens at a paragraph carrying an endNote and runs to the next one.
 * Everything before its first choice paragraph is stem; the rest are choices,
 * which a 수능 paper splits across the print column.
 */
export declare function assembleItems(paragraphs: readonly SourceParagraph[], answerFor: (n: number) => string | undefined, binItems?: BinItemTable, fixtureBasename?: string): Item[];
