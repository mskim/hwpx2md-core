"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathNode = void 0;
const xml_1 = require("../ingest/xml");
const converter_1 = require("../eq_to_latex/converter");
/**
 * Wraps an hp:equation element. Converts the HWP equation source using the
 * EqToLatex converter (ported from Ruby). Falls back to a fenced
 * `hwp-equation` code block if conversion throws.
 */
class MathNode {
    source;
    constructor(source) {
        this.source = source;
    }
    static from(node) {
        const scriptEl = (0, xml_1.findAll)(node, ".//hp:script")[0];
        const raw = (scriptEl?.textContent ?? "").trim();
        return new MathNode(raw);
    }
    toMarkdown() {
        if (this.source === "")
            return "";
        try {
            return new converter_1.Converter().convert(this.source, { wrap: "display" });
        }
        catch (_e) {
            return "```hwp-equation\n" + this.source + "\n```";
        }
    }
}
exports.MathNode = MathNode;
//# sourceMappingURL=math_node.js.map