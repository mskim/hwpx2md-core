export interface StyleFlags {
    readonly bold: boolean;
    readonly italic: boolean;
    readonly underline: boolean;
    readonly strikethrough: boolean;
    readonly supscript: boolean;
    readonly subscript: boolean;
}
export type CharPrTable = ReadonlyMap<string, StyleFlags>;
/**
 * Parse `Contents/header.xml` and return a lookup from charPr id to its
 * style flags. Recognises bold (`<hh:bold/>`), italic (`<hh:italic/>`), and
 * underline (`<hh:underline type="..."/>` where type != "NONE").
 *
 * Other charPr properties (color, size, ratio, etc.) are intentionally
 * ignored for Phase 4 Option C1 scope.
 */
export declare function parseCharPrTable(xmldoc: Document): CharPrTable;
