import type { BinItemTable } from "../ingest/bin_items";
import { ImageNode } from "./image_node";
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
