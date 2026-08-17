"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCharPrTable = parseCharPrTable;
const xml_1 = require("./xml");
/**
 * Parse `Contents/header.xml` and return a lookup from charPr id to its
 * style flags. Recognises bold (`<hh:bold/>`), italic (`<hh:italic/>`), and
 * underline (`<hh:underline type="..."/>` where type != "NONE").
 *
 * Other charPr properties (color, size, ratio, etc.) are intentionally
 * ignored for Phase 4 Option C1 scope.
 */
function parseCharPrTable(xmldoc) {
    const table = new Map();
    for (const charPr of (0, xml_1.findAll)(xmldoc, "//hh:charPr")) {
        const id = charPr.getAttribute("id");
        if (!id)
            continue;
        const bold = (0, xml_1.findAll)(charPr, "hh:bold").length > 0;
        const italic = (0, xml_1.findAll)(charPr, "hh:italic").length > 0;
        const underlineEls = (0, xml_1.findAll)(charPr, "hh:underline");
        const underline = underlineEls.length > 0 && underlineEls[0].getAttribute("type") !== "NONE";
        const strikeoutEls = (0, xml_1.findAll)(charPr, "hh:strikeout");
        const strikethrough = strikeoutEls.length > 0 && strikeoutEls[0].getAttribute("shape") !== "NONE";
        const supscript = (0, xml_1.findAll)(charPr, "hh:supscript").length > 0;
        const subscript = (0, xml_1.findAll)(charPr, "hh:subscript").length > 0;
        table.set(id, { bold, italic, underline, strikethrough, supscript, subscript });
    }
    return table;
}
//# sourceMappingURL=styles.js.map