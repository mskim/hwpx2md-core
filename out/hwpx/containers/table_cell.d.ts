import type { BinItemTable } from "../ingest/bin_items";
import { ImageNode } from "./image_node";
/**
 * Wraps an hp:tc element. Phase 3 emits plain text only — no inline styling,
 * no line breaks, no nested tables (if a cell's paragraph contains another
 * hp:tbl, its text descendants are flattened into the cell text).
 *
 * Mirrors Ruby's TableCell#to_markdown: concatenate hp:t text, strip, escape
 * pipe characters, substitute &nbsp; when empty.
 *
 * Also supports HTML emission for span tables (Task 8).
 */
export declare class TableCell {
    private readonly _rawText;
    private readonly _colSpan;
    private readonly _rowSpan;
    readonly colAddr: number;
    readonly rowAddr: number;
    /** Pics living in THIS cell. The paragraph owns only the free ones. */
    readonly images: ImageNode[];
    private constructor();
    /**
     * `binItems` and `fixtureBasename` are OPTIONAL, and must stay that way: the
     * container unit tests call TableCell.from / TableRow.from / Table.from
     * directly with the original arity.
     */
    static from(node: Element, binItems?: BinItemTable, fixtureBasename?: string): TableCell;
    get colSpan(): number;
    get rowSpan(): number;
    get merged(): boolean;
    toMarkdown(): string;
    /** Emit <td> with colspan/rowspan for HTML table fallback. */
    toHtmlTd(): string;
}
