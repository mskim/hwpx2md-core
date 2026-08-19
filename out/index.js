"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionError = exports.normaliseLatex = exports.EXAM_TRACKS = exports.ExamPaper = exports.Document = void 0;
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
/**
 * The exam API. A 수능 수학 .hwpx holds 공통 plus three electives — 46 items in
 * one file, with 23-30 appearing three times — so it converts to FOUR markdown
 * files rather than one, in the exam convention:
 *
 *   const files = await ExamPaper.open(path, { source: "2022-11 실전" });
 *   files[0].filename   // 2022-11-실전-공통.md
 *   files[0].markdown   // front matter, ## <n>, choices, ### 정답, ### 해설
 *
 * See docs/superpowers/specs/2026-08-19-markdown-exam-convention-design.md in
 * the wehangul repo.
 */
var paper_1 = require("./hwpx/exam/paper");
Object.defineProperty(exports, "ExamPaper", { enumerable: true, get: function () { return paper_1.ExamPaper; } });
var tracks_1 = require("./hwpx/exam/tracks");
Object.defineProperty(exports, "EXAM_TRACKS", { enumerable: true, get: function () { return tracks_1.TRACKS; } });
/** Exposed so a caller can normalise LaTeX a teacher typed, not only converted. */
var latex_1 = require("./hwpx/exam/latex");
Object.defineProperty(exports, "normaliseLatex", { enumerable: true, get: function () { return latex_1.normaliseLatex; } });
var types_1 = require("./types");
Object.defineProperty(exports, "ConversionError", { enumerable: true, get: function () { return types_1.ConversionError; } });
//# sourceMappingURL=index.js.map