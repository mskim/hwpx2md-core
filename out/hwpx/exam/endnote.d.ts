import { ImageNode } from "../containers/image_node";
import type { BinItemTable } from "../ingest/bin_items";
/**
 * One `hp:endNote` — in a 수능 exam paper, an item's number, answer and 해설.
 *
 * A separate extractor, deliberately NOT a clone of the footnote path. That path
 * (`paragraph.ts`) collects `hp:t` and nothing else, which is right for a
 * footnote of prose and catastrophic here: endnote bodies across the four exam
 * papers hold 4,867 equations — an average of 27 per item, 132 in the worst —
 * plus 16–26 figures and up to 4 tables each. Cloning it would emit every worked
 * solution as its connecting words with all the mathematics removed, and look
 * like it had worked.
 *
 * The footnote path is also the wrong SHAPE: it emits a `[^n]` reference and
 * queues the body to the document tail, where an answer key does not belong.
 */
export declare class EndNote {
    readonly number: number;
    readonly bodyMarkdown: string;
    /** Figures inside the explanation, so the document can write them to disk. */
    readonly images: ImageNode[];
    private constructor();
    static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): EndNote;
}
