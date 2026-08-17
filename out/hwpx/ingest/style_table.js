"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleTable = void 0;
const xml_1 = require("./xml");
const TOC_HEADING_LEVEL = {
    "차례 제목": 1,
    "차례 1": 2,
    "차례 2": 3,
    "차례 3": 4,
};
class StyleTable {
    names;
    constructor(names) {
        this.names = names;
    }
    static empty() {
        return new StyleTable(new Map());
    }
    static fromHeader(headerDoc) {
        const names = new Map();
        for (const styleEl of (0, xml_1.findAll)(headerDoc, "//hh:style")) {
            const id = styleEl.getAttribute("id");
            const name = styleEl.getAttribute("name");
            if (id != null && name != null) {
                names.set(id, name);
            }
        }
        return new StyleTable(names);
    }
    nameFor(id) {
        return this.names.get(id);
    }
    headingLevelFor(id) {
        const name = this.nameFor(id);
        if (name == null)
            return undefined;
        return TOC_HEADING_LEVEL[name];
    }
}
exports.StyleTable = StyleTable;
//# sourceMappingURL=style_table.js.map