"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionError = exports.Document = void 0;
exports.createHwpxConverter = createHwpxConverter;
const document_1 = require("./hwpx/document");
/**
 * Native TypeScript HWPX converter.
 *
 * Extracted from the hwpx2md VS Code extension. The extension's own
 * `getHwpxConverter(extensionRoot: vscode.Uri)` is now a thin adapter over
 * `createHwpxConverter()`; it still takes and still ignores the Uri.
 */
class HwpxConverter {
    name = "typescript:hwpx2md";
    async convert(sourcePath) {
        const doc = await document_1.Document.open(sourcePath);
        return {
            markdown: doc.toMarkdown(),
            assets: doc.assets(),
        };
    }
}
function createHwpxConverter() {
    return new HwpxConverter();
}
// The low-level API. Parity is measured on Document, not on ConversionResult,
// so the parity harness and cross-check.sh both reach for this.
var document_2 = require("./hwpx/document");
Object.defineProperty(exports, "Document", { enumerable: true, get: function () { return document_2.Document; } });
var types_1 = require("./types");
Object.defineProperty(exports, "ConversionError", { enumerable: true, get: function () { return types_1.ConversionError; } });
//# sourceMappingURL=index.js.map