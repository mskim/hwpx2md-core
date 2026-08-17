"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBinItemTable = parseBinItemTable;
const xml_1 = require("./xml");
/**
 * Parse `Contents/content.hpf` (the HWPX package manifest) and return a map
 * from `opf:item/@id` to its `href`. Used to resolve image `binaryItemIDRef`
 * values to their actual `BinData/<file>` paths inside the HWPX zip.
 *
 * Filtering (e.g. "only items under BinData/") is the caller's responsibility.
 */
function parseBinItemTable(xmldoc) {
    const table = new Map();
    for (const item of (0, xml_1.findAll)(xmldoc, "//opf:item")) {
        const id = item.getAttribute("id");
        const href = item.getAttribute("href");
        if (!id || !href)
            continue;
        table.set(id, { href });
    }
    return table;
}
//# sourceMappingURL=bin_items.js.map