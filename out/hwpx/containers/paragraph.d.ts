import type { BinItemTable } from "../ingest/bin_items";
import type { CharPrTable } from "../ingest/styles";
import type { StyleTable } from "../ingest/style_table";
import { ImageNode } from "./image_node";
import { MathNode } from "./math_node";
import { Table } from "./table";
import { TextRun } from "./text_run";
export interface BulletItemSentinel {
    type: "bullet_item";
    level: number;
    text: string;
}
export interface NumberedItemSentinel {
    type: "numbered_item";
    level: number;
    text: string;
}
export type ParagraphContent = string | BulletItemSentinel | NumberedItemSentinel;
export declare class Paragraph {
    readonly textRuns: TextRun[];
    readonly table: Table | null;
    readonly images: ImageNode[];
    readonly equations: MathNode[];
    private readonly styleId;
    private readonly styleTable;
    private readonly paraPrId;
    private readonly headerDoc;
    private readonly _node;
    private readonly _charPrTable;
    private readonly _footnoteQueue;
    private constructor();
    static from(node: Element, charPrTable?: CharPrTable, binItems?: BinItemTable, styleTable?: StyleTable, headerDoc?: Document, fixtureBasename?: string, footnoteQueue?: Array<[string, string]>): Paragraph;
    private runTextOnly;
    /**
     * Look up the paraPr's heading info from header.xml.
     * Returns null or { kind: 'bullet' | 'numbered', level: number }.
     *
     * Heuristic: distinguish real numbered lists from heading-style outline numbering.
     * HWPX paraPrs that reference an hh:numbering definition with start="0" are
     * treated as actual lists; start>0 is treated as heading-style and skipped here.
     * (Same heuristic as Ruby Phase 1.)
     */
    private listDescriptorForParaPr;
    toMarkdown(): ParagraphContent;
    /**
     * Renders a paragraph that contains hp:equation nodes inline with text.
     * Walks run children: hp:t → emit text, hp:equation → emit converted LaTeX.
     * Mirrors the Ruby to_txt logic with hp:script handling.
     */
    private renderWithInlineEquations;
    /**
     * Scans the paragraph node for hp:fieldBegin[@type="HYPERLINK"] / hp:fieldEnd pairs.
     * Returns an array of span descriptors mirroring the Ruby scan_hyperlink_spans method.
     */
    private scanHyperlinkSpans;
    /**
     * Renders the text paragraph with hyperlink spans and/or footnotes applied.
     * Mirrors the Ruby to_markdown loop logic.
     */
    private renderWithHyperlinksAndFootnotes;
}
