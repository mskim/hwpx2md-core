"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndNote = void 0;
const image_node_1 = require("../containers/image_node");
const math_node_1 = require("../containers/math_node");
const table_1 = require("../containers/table");
const xml_1 = require("../ingest/xml");
const latex_1 = require("./latex");
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
class EndNote {
    number;
    bodyMarkdown;
    images;
    constructor(number, bodyMarkdown, 
    /** Figures inside the explanation, so the document can write them to disk. */
    images) {
        this.number = number;
        this.bodyMarkdown = bodyMarkdown;
        this.images = images;
    }
    static from(node, binItems, fixtureBasename) {
        const number = parseInt(node.getAttribute("number") ?? "0", 10);
        const images = [];
        let body = "";
        // `hp:subList/hp:p`, single slash. The descendant form also returns the
        // paragraphs inside this note's own table cells — 30 against 12 in one real
        // endnote — so their text would render once in the table and again loose.
        for (const p of (0, xml_1.findAll)(node, "hp:subList/hp:p")) {
            for (const run of (0, xml_1.findAll)(p, "hp:run")) {
                for (const child of Array.from(run.childNodes)) {
                    if (child.nodeType !== 1)
                        continue;
                    switch (child.localName) {
                        case "t":
                            body += child.textContent ?? "";
                            break;
                        case "equation":
                            body += math_node_1.MathNode.from(child).toMarkdown();
                            break;
                        case "pic": {
                            if (!binItems)
                                break;
                            const img = image_node_1.ImageNode.from(child, binItems, fixtureBasename ?? "");
                            images.push(img);
                            body += img.toMarkdown();
                            break;
                        }
                        case "tbl":
                            body += table_1.Table.from(child, binItems, fixtureBasename).toMarkdown();
                            break;
                        default:
                            break; // ctrl, secPr, linesegarray …
                    }
                }
            }
        }
        return new EndNote(number, (0, latex_1.normaliseLatex)(body), images);
    }
}
exports.EndNote = EndNote;
//# sourceMappingURL=endnote.js.map