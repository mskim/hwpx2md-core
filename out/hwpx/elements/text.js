"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.Text = void 0;
/**
 * Thin wrapper over an hp:t element's text content. Mirrors Ruby's
 * `Hwpx2md::Elements::Text#content`. Read-only — we never write HWPX.
 */
class Text {
    content;
    constructor(content) {
        this.content = content;
    }
    static from(node) {
        // hp:t is always a leaf in the HWPX spec; textContent is safe.
        return new Text(node.textContent ?? "");
    }
}
exports.Text = Text;
//# sourceMappingURL=text.js.map