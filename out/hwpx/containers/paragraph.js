"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paragraph = void 0;
const xml_1 = require("../ingest/xml");
const escaper_1 = require("../markdown/escaper");
const image_node_1 = require("./image_node");
const math_node_1 = require("./math_node");
const table_1 = require("./table");
const text_run_1 = require("./text_run");
/**
 * Wraps an hp:p element.
 *
 * Images are a PREFIX, not a mode. A paragraph resolves its FREE pics — those
 * with no hp:tc ancestor — and emits them ahead of whatever else it holds:
 *
 *   free pics + text     → `![](…)` , blank line, text
 *   free pics + no text  → the images alone (byte-identical to the old behaviour)
 *   free pics + list     → the images ABOVE the bullet, via imagePrefix
 *
 * The body is still one of table / equations / text runs, in that order.
 *
 * This replaces an either/or dispatch that made a pic paragraph ImageNode[] and
 * never read its runs, costing 18 paragraphs and 1,796 characters of the
 * reference manuscript — the 추천사 pages, where a signature image sits beside a
 * testimonial.
 *
 * Pics inside an hp:tc belong to that CELL, which renders and extracts them.
 * The partition is total and disjoint, which is what stops the two paragraphs
 * in chapter 07 that hold both a table and a free pic from double-emitting.
 */
/**
 * Excludes anything living inside an hp:pic — its caption is the image's alt
 * text (`ImageNode.caption()`), not prose of the paragraph the image sits in.
 */
const NOT_IN_PIC = "[not(ancestor::hp:pic)]";
/** A pic under a table cell belongs to the cell, not to this paragraph. */
const NOT_IN_CELL = "[not(ancestor::hp:tc)]";
/**
 * Body text excludes both a pic's caption and anything inside a table.
 *
 * The hp:tbl half is a GUARD, not a fix for an observed failure: the heading
 * check (`headingLevelFor`) and the list check both run on `runTextOnly()`
 * BEFORE the table branch, so populating runs unscoped would render `#`
 * followed by every hp:t in the table, flattened. No fixture and no page in the
 * reference book has that shape today — which is the argument for the guard,
 * not against it.
 */
const NOT_IN_PIC_OR_TBL = "[not(ancestor::hp:pic) and not(ancestor::hp:tbl)]";
class Paragraph {
    textRuns;
    table;
    images;
    equations;
    styleId;
    styleTable;
    paraPrId;
    headerDoc;
    _node;
    _charPrTable;
    _footnoteQueue;
    constructor(textRuns, table, images, equations, styleId, styleTable, paraPrId, headerDoc, _node = null, _charPrTable = null, _footnoteQueue = null) {
        this.textRuns = textRuns;
        this.table = table;
        this.images = images;
        this.equations = equations;
        this.styleId = styleId;
        this.styleTable = styleTable;
        this.paraPrId = paraPrId;
        this.headerDoc = headerDoc;
        this._node = _node;
        this._charPrTable = _charPrTable;
        this._footnoteQueue = _footnoteQueue;
    }
    static from(node, charPrTable, binItems, styleTable, headerDoc, fixtureBasename, footnoteQueue) {
        const styleId = node.getAttribute("styleIDRef");
        const paraPrId = node.getAttribute("paraPrIDRef");
        // Resolved ONCE, ahead of the branch, because every branch carries them now.
        const images = binItems
            ? (0, xml_1.findAll)(node, `.//hp:pic${NOT_IN_CELL}`).map(p => image_node_1.ImageNode.from(p, binItems, fixtureBasename ?? ""))
            : [];
        const tableNodes = (0, xml_1.findAll)(node, ".//hp:tbl");
        if (tableNodes.length > 0) {
            return new Paragraph([], table_1.Table.from(tableNodes[0]), images, [], styleId, styleTable ?? null, paraPrId, headerDoc ?? null);
        }
        const eqNodes = (0, xml_1.findAll)(node, ".//hp:equation");
        if (eqNodes.length > 0) {
            return new Paragraph([], null, images, eqNodes.map(e => math_node_1.MathNode.from(e)), styleId, styleTable ?? null, paraPrId, headerDoc ?? null, node, charPrTable ?? null, footnoteQueue ?? null);
        }
        // NOT_IN_PIC: a pic carries its caption at hp:pic > hp:caption >
        // hp:subList > hp:p > hp:run > hp:t. An unscoped `.//hp:run` picks up the
        // caption's own run, emitting the caption a second time at paragraph level;
        // TextRun's matching scope stops it being spliced into the sentence beside
        // it. Both are needed — they remove different halves of the same defect.
        const runNodes = (0, xml_1.findAll)(node, `.//hp:run${NOT_IN_PIC_OR_TBL}`);
        return new Paragraph(runNodes.map(r => text_run_1.TextRun.from(r, charPrTable)), null, images, [], styleId, styleTable ?? null, paraPrId, headerDoc ?? null, node, charPrTable ?? null, footnoteQueue ?? null);
    }
    runTextOnly() {
        return this.textRuns.map(r => r.text).join("").trim();
    }
    /**
     * Look up the paraPr's heading info from header.xml.
     * Returns null or { kind: 'bullet' | 'numbered', level: number }.
     *
     * Heuristic: distinguish real numbered lists from heading-style outline numbering.
     * HWPX paraPrs that reference an hh:numbering definition with start="0" are
     * treated as actual lists; start>0 is treated as heading-style and skipped here.
     * (Same heuristic as Ruby Phase 1.)
     */
    listDescriptorForParaPr() {
        if (!this.paraPrId || !this.headerDoc)
            return null;
        // Find the paraPr element in header.xml
        let paraPrNode = null;
        const paraPrNodes = (0, xml_1.findAll)(this.headerDoc, `//hh:paraPr`);
        for (const n of paraPrNodes) {
            if (n.getAttribute("id") === this.paraPrId) {
                paraPrNode = n;
                break;
            }
        }
        if (!paraPrNode)
            return null;
        // Find the heading child
        const headingNodes = (0, xml_1.findAll)(paraPrNode, "hh:heading");
        if (headingNodes.length === 0)
            return null;
        const heading = headingNodes[0];
        const headingType = heading.getAttribute("type");
        const level = parseInt(heading.getAttribute("level") ?? "0", 10);
        const idRef = heading.getAttribute("idRef");
        // Guard: check if the referenced numbering has start > 0 (heading-style, not a real list)
        if (idRef && idRef !== "0") {
            const numberingNodes = (0, xml_1.findAll)(this.headerDoc, `//hh:numbering`);
            for (const n of numberingNodes) {
                if (n.getAttribute("id") === idRef) {
                    const start = parseInt(n.getAttribute("start") ?? "0", 10);
                    if (start > 0)
                        return null;
                    break;
                }
            }
        }
        if (headingType === "BULLET")
            return { kind: "bullet", level };
        if (headingType === "NUMBER")
            return { kind: "numbered", level };
        return null;
    }
    /**
     * Free pics first, then the body.
     *
     * The separator is a BLANK LINE, and specifically not a single newline. The
     * gem pushes each image as its own `content` entry and
     * `ImageNode#to_markdown` already ends in "\n", so `content.join("\n")`
     * yields `![](a)\n\n![](b)\n`. That trailing newline in the gem is what this
     * depends on; deleting it there silently breaks parity here.
     */
    toMarkdown() {
        const imageMd = this.images
            .map(i => i.toMarkdown())
            .filter(md => md !== "")
            .join("\n\n");
        const body = this.bodyMarkdown();
        if (imageMd === "")
            return body;
        // A list item keeps its structure; the image goes above it, not inside.
        if (typeof body !== "string")
            return { ...body, imagePrefix: imageMd };
        // The gem's skip_para: an image paragraph with no prose is the image alone.
        // This is what holds the three existing image goldens byte-identical.
        return body.trim() === "" ? imageMd : `${imageMd}\n\n${body}`;
    }
    bodyMarkdown() {
        // TOC heading detection: check styleIDRef before any other content dispatch
        if (this.styleId && this.styleTable) {
            const level = this.styleTable.headingLevelFor(this.styleId);
            if (level !== undefined) {
                const text = this.runTextOnly();
                return `${"#".repeat(level)} ${text}`;
            }
        }
        // Bullet/numbered list detection
        const desc = this.listDescriptorForParaPr();
        if (desc?.kind === "bullet") {
            return { type: "bullet_item", level: desc.level, text: this.runTextOnly() };
        }
        if (desc?.kind === "numbered") {
            return { type: "numbered_item", level: desc.level, text: this.runTextOnly() };
        }
        if (this.table)
            return this.table.toMarkdown();
        if (this.equations.length > 0) {
            // Check if equations are mixed with text in the same run (inline equations)
            if (this._node) {
                const hasInlineText = (0, xml_1.findAll)(this._node, `.//hp:t${NOT_IN_PIC}`).some(t => (t.textContent ?? "").trim().length > 0);
                if (hasInlineText) {
                    return this.renderWithInlineEquations();
                }
            }
            return this.equations.map(e => e.toMarkdown()).join("\n");
        }
        // Check if hyperlinks or footnotes are present; if so, use node-level rendering
        if (this._node) {
            const hasFootnotes = (0, xml_1.findAll)(this._node, ".//hp:footNote").length > 0;
            const linkSpans = this.scanHyperlinkSpans();
            if (linkSpans.length > 0 || hasFootnotes) {
                return this.renderWithHyperlinksAndFootnotes(linkSpans);
            }
        }
        return this.textRuns.map(r => r.toMarkdown()).join("");
    }
    /**
     * Renders a paragraph that contains hp:equation nodes inline with text.
     * Walks run children: hp:t → emit text, hp:equation → emit converted LaTeX.
     * Mirrors the Ruby to_txt logic with hp:script handling.
     */
    renderWithInlineEquations() {
        if (!this._node)
            return this.equations.map(e => e.toMarkdown()).join("\n");
        const paraNodes = (0, xml_1.findAll)(this._node, "hp:run|hp:linesegarray");
        let out = "";
        for (const node of paraNodes) {
            if (isLineSegArray(node)) {
                // linesegarray marks end-of-visual-line; skip as document.ts handles
                // paragraph separation with double newline at join time.
                continue;
            }
            const runChildren = Array.from(node.childNodes);
            for (const child of runChildren) {
                if (child.nodeType !== 1)
                    continue;
                const localName = child.localName;
                if (localName === "t") {
                    out += child.textContent ?? "";
                }
                else if (localName === "equation") {
                    const mathNode = math_node_1.MathNode.from(child);
                    out += mathNode.toMarkdown();
                }
                // skip ctrl, secPr, etc.
            }
        }
        return out;
    }
    /**
     * Scans the paragraph node for hp:fieldBegin[@type="HYPERLINK"] / hp:fieldEnd pairs.
     * Returns an array of span descriptors mirroring the Ruby scan_hyperlink_spans method.
     */
    scanHyperlinkSpans() {
        if (!this._node)
            return [];
        // Use direct children only to avoid descending into footnote subLists
        const paraNodes = (0, xml_1.findAll)(this._node, "hp:run|hp:linesegarray");
        const pending = new Map();
        const spans = [];
        paraNodes.forEach((node, idx) => {
            if (!isRunNode(node))
                return;
            // Check for fieldBegin HYPERLINK controls
            const fieldBeginCtrls = (0, xml_1.findAll)(node, `.//hp:ctrl${NOT_IN_PIC}`).filter(ctrl => (0, xml_1.findAll)(ctrl, ".//hp:fieldBegin").some(fb => fb.getAttribute("type") === "HYPERLINK"));
            for (const ctrl of fieldBeginCtrls) {
                const fbNodes = (0, xml_1.findAll)(ctrl, ".//hp:fieldBegin");
                const fb = fbNodes.find(n => n.getAttribute("type") === "HYPERLINK");
                if (!fb)
                    continue;
                const url = extractHyperlinkUrl(fb);
                if (!url)
                    continue;
                const fieldId = fb.getAttribute("fieldid") ?? "";
                // Pretexts: hp:t siblings before this ctrl in the run
                const pretexts = getTextBefore(node, ctrl);
                pending.set(fieldId, {
                    beginRunIdx: idx,
                    beginIdx: idx + 1,
                    url,
                    beginRunPretexts: pretexts,
                });
            }
            // Check for fieldEnd controls
            const fieldEndCtrls = (0, xml_1.findAll)(node, `.//hp:ctrl${NOT_IN_PIC}`).filter(ctrl => (0, xml_1.findAll)(ctrl, ".//hp:fieldEnd").length > 0);
            for (const ctrl of fieldEndCtrls) {
                const feNodes = (0, xml_1.findAll)(ctrl, ".//hp:fieldEnd");
                const fe = feNodes[0];
                if (!fe)
                    continue;
                const fieldId = fe.getAttribute("fieldid") ?? "";
                const spanStart = pending.get(fieldId);
                if (spanStart) {
                    pending.delete(fieldId);
                    const posttexts = getTextAfter(node, ctrl);
                    spans.push({
                        beginRunIdx: spanStart.beginRunIdx,
                        beginIdx: spanStart.beginIdx,
                        endIdx: idx - 1,
                        endRunIdx: idx,
                        url: spanStart.url,
                        beginRunPretexts: spanStart.beginRunPretexts ?? [],
                        endRunPosttexts: posttexts,
                    });
                }
            }
        });
        return spans;
    }
    /**
     * Renders the text paragraph with hyperlink spans and/or footnotes applied.
     * Mirrors the Ruby to_markdown loop logic.
     */
    renderWithHyperlinksAndFootnotes(linkSpans) {
        if (!this._node)
            return "";
        // Use direct children only to avoid descending into footnote subLists
        const paraNodes = (0, xml_1.findAll)(this._node, "hp:run|hp:linesegarray");
        const skipIdxSet = new Set();
        for (const span of linkSpans) {
            for (let i = span.beginIdx; i <= span.endIdx; i++) {
                skipIdxSet.add(i);
            }
        }
        let out = "";
        let linkBuffer = null;
        let currentUrl = null;
        paraNodes.forEach((node, runIdx) => {
            if (isLineSegArray(node)) {
                // linesegarray marks a line break within a paragraph — skip to stay
                // consistent with the golden (no trailing \n before paragraph join in document.ts).
                return;
            }
            // Handle the run containing fieldBegin
            const beginSpan = linkSpans.find(s => s.beginRunIdx === runIdx);
            if (beginSpan) {
                for (const pretext of beginSpan.beginRunPretexts) {
                    out += (0, escaper_1.escapeInline)(pretext);
                }
                linkBuffer = "";
                currentUrl = beginSpan.url;
                return;
            }
            // Handle the run containing fieldEnd
            if (linkBuffer !== null) {
                const endSpan = linkSpans.find(s => s.endRunIdx === runIdx);
                if (endSpan) {
                    out += `[${linkBuffer}](${currentUrl})`;
                    linkBuffer = null;
                    currentUrl = null;
                    for (const posttext of endSpan.endRunPosttexts) {
                        out += posttext;
                    }
                    return;
                }
            }
            // For runs inside a link span, buffer text
            if (linkBuffer !== null && skipIdxSet.has(runIdx)) {
                for (const t of (0, xml_1.findAll)(node, `.//hp:t${NOT_IN_PIC}`)) {
                    linkBuffer += t.textContent ?? "";
                }
                return;
            }
            // Node-level scan for this run: handle hp:ctrl (footnotes) and hp:t
            // We iterate direct children to avoid picking up footnote body text from
            // nested hp:t nodes inside hp:footNote subLists.
            const charPrRef = node.getAttribute("charPrIDRef") ?? "";
            const style = this._charPrTable?.get(charPrRef);
            let runText = "";
            const runChildren = Array.from(node.childNodes);
            for (const child of runChildren) {
                if (child.nodeType !== 1)
                    continue;
                const localName = child.localName;
                if (localName === "ctrl") {
                    // Emit accumulated run text before this ctrl
                    if (runText) {
                        out += applyStyleFlags(runText, style);
                        runText = "";
                    }
                    // Check for footnote
                    const footnoteNodes = (0, xml_1.findAll)(child, ".//hp:footNote");
                    if (footnoteNodes.length > 0 && this._footnoteQueue !== null) {
                        const footnoteNode = footnoteNodes[0];
                        const autoNumNodes = (0, xml_1.findAll)(footnoteNode, ".//hp:autoNum");
                        const autoNum = autoNumNodes[0];
                        if (autoNum) {
                            const num = autoNum.getAttribute("num") ?? "";
                            // Get body text from the footnote's inner paragraph hp:t nodes,
                            // but skip the autoNum ctrl itself (first ctrl in inner run).
                            let bodyText = "";
                            const innerRuns = (0, xml_1.findAll)(footnoteNode, ".//hp:run");
                            for (const ir of innerRuns) {
                                for (const irChild of Array.from(ir.childNodes)) {
                                    if (irChild.nodeType === 1 && irChild.localName === "t") {
                                        bodyText += irChild.textContent ?? "";
                                    }
                                }
                            }
                            bodyText = bodyText.trim();
                            if (!this._footnoteQueue.some(([n]) => n === num)) {
                                this._footnoteQueue.push([num, bodyText]);
                            }
                            out += `[^${num}]`;
                        }
                    }
                    // Other ctrl types (fieldBegin/fieldEnd) are handled at the run level above
                }
                else if (localName === "t") {
                    runText += child.textContent ?? "";
                }
            }
            // Emit any remaining run text
            if (runText) {
                out += applyStyleFlags(runText, style);
            }
        });
        return out;
    }
}
exports.Paragraph = Paragraph;
function isRunNode(node) {
    return node.localName === "run";
}
function isLineSegArray(node) {
    return node.localName === "linesegarray";
}
/**
 * Get text content of hp:t nodes appearing before a given ctrl element in the run.
 * "Before" means earlier siblings at the run's direct child level.
 */
function getTextBefore(runNode, ctrlNode) {
    const texts = [];
    let sibling = runNode.firstChild;
    while (sibling) {
        if (sibling === ctrlNode)
            break;
        if (sibling.nodeType === 1 && sibling.localName === "t") {
            texts.push(sibling.textContent ?? "");
        }
        sibling = sibling.nextSibling;
    }
    return texts;
}
/**
 * Get text content of hp:t nodes appearing after a given ctrl element in the run.
 */
function getTextAfter(runNode, ctrlNode) {
    const texts = [];
    let found = false;
    let sibling = runNode.firstChild;
    while (sibling) {
        if (sibling === ctrlNode) {
            found = true;
        }
        else if (found && sibling.nodeType === 1 && sibling.localName === "t") {
            texts.push(sibling.textContent ?? "");
        }
        sibling = sibling.nextSibling;
    }
    return texts;
}
function extractHyperlinkUrl(fieldBeginNode) {
    // Find hp:stringParam[@name="Command"] anywhere in the fieldBegin descendants
    const params = (0, xml_1.findAll)(fieldBeginNode, ".//hp:stringParam");
    const cmdParam = params.find(p => p.getAttribute("name") === "Command");
    if (!cmdParam)
        return null;
    const raw = (cmdParam.textContent ?? "").trim();
    // Format: |https\://example.com/;0;0;0;
    const url = raw.replace(/^\|/, "").replace(/\\:/g, ":").split(";")[0];
    return url?.trim() || null;
}
/**
 * Apply inline style flags to text. Mirrors TextRun.applyStyles but accepts
 * an optional StyleFlags (undefined = no styling).
 */
function applyStyleFlags(text, s) {
    if (!s)
        return text;
    let out = text;
    if (s.bold && s.italic)
        out = `***${out}***`;
    else if (s.bold)
        out = `**${out}**`;
    else if (s.italic)
        out = `*${out}*`;
    if (s.strikethrough)
        out = `~~${out}~~`;
    if (s.supscript)
        out = `<sup>${out}</sup>`;
    if (s.subscript)
        out = `<sub>${out}</sub>`;
    if (s.underline)
        out = `<u>${out}</u>`;
    return out;
}
//# sourceMappingURL=paragraph.js.map