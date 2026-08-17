export interface BinItem {
    readonly href: string;
}
export type BinItemTable = ReadonlyMap<string, BinItem>;
/**
 * Parse `Contents/content.hpf` (the HWPX package manifest) and return a map
 * from `opf:item/@id` to its `href`. Used to resolve image `binaryItemIDRef`
 * values to their actual `BinData/<file>` paths inside the HWPX zip.
 *
 * Filtering (e.g. "only items under BinData/") is the caller's responsibility.
 */
export declare function parseBinItemTable(xmldoc: Document): BinItemTable;
