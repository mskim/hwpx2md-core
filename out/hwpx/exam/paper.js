"use strict";
/// <reference lib="dom" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACKS = exports.ExamPaper = void 0;
const path = __importStar(require("node:path"));
// Aliased: the parser's Document would otherwise shadow the DOM Document that
// findAll and parseXml are typed against.
const document_1 = require("../document");
const bin_items_1 = require("../ingest/bin_items");
const xml_1 = require("../ingest/xml");
const zip_1 = require("../ingest/zip");
const answer_key_1 = require("./answer_key");
const emit_1 = require("./emit");
const item_1 = require("./item");
const tracks_1 = require("./tracks");
Object.defineProperty(exports, "TRACKS", { enumerable: true, get: function () { return tracks_1.TRACKS; } });
/**
 * One 수능 수학 `.hwpx` becomes FOUR markdown files, one per track.
 *
 * A paper holds 공통 plus three electives — 46 items in one file, with 23-30
 * appearing three times over. Splitting is not cosmetic: anything keyed on the
 * item number alone collapses those three into one, which is why
 * quiz_maker_math has an exam_track_splitter of its own.
 */
class ExamPaper {
    static async open(sourcePath, opts = {}) {
        const basename = path.basename(sourcePath, path.extname(sourcePath));
        const entries = await (0, zip_1.openHwpx)(sourcePath);
        const binItems = entries.has("Contents/content.hpf")
            ? (0, bin_items_1.parseBinItemTable)((0, xml_1.parseXml)(entries.get("Contents/content.hpf")))
            : new Map();
        // The rendered markdown recognises choice paragraphs; the nodes carry the
        // endnotes and the stems. Both are needed, in step.
        const doc = await document_1.Document.open(sourcePath, basename);
        const rendered = doc.paragraphs().map(p => String(p.toMarkdown()));
        const nodes = [];
        for (const name of [...entries.keys()].filter(n => /^Contents\/section\d+\.xml$/.test(n)).sort()) {
            nodes.push(...(0, xml_1.findAll)((0, xml_1.parseXml)(entries.get(name)), "//hs:sec/hp:p"));
        }
        const key = (0, answer_key_1.parseAnswerKey)((0, xml_1.parseXml)(entries.get("Contents/section0.xml")));
        const source = opts.source ?? basename;
        const byNode = new Map();
        nodes.forEach((node, i) => byNode.set(node, { node, markdown: rendered[i] ?? "" }));
        return (0, tracks_1.splitByTrack)(nodes).map(section => {
            const paragraphs = section.nodes
                .map(n => byNode.get(n))
                .filter((p) => p !== undefined);
            const items = (0, item_1.assembleItems)(paragraphs, n => key?.get(section.track)?.get(n), binItems, basename);
            const front = {
                kind: "exam",
                subject: "수학",
                track: section.track,
                source,
                ...(opts.grade ? { grade: opts.grade } : {}),
            };
            return {
                track: section.track,
                front,
                items,
                markdown: (0, emit_1.emitExam)(front, items),
                filename: `${slug(source)}-${section.track}.md`,
            };
        });
    }
}
exports.ExamPaper = ExamPaper;
/** `2022-11 실전` → `2022-11-실전`, so four files sit together in a listing. */
function slug(source) {
    return source.trim().replace(/\s+/g, "-").replace(/[/\\:*?"<>|]/g, "_");
}
//# sourceMappingURL=paper.js.map