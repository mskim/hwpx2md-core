"use strict";
/// <reference lib="dom" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.stemMarkdown = stemMarkdown;
exports.assembleItems = assembleItems;
const math_node_1 = require("../containers/math_node");
const xml_1 = require("../ingest/xml");
const answer_1 = require("./answer");
const choices_1 = require("./choices");
const endnote_1 = require("./endnote");
const latex_1 = require("./latex");
/** Everything inside a note, a picture or a table belongs to those, not the stem. */
const OWN_RUN = ".//hp:run[not(ancestor::hp:pic) and not(ancestor::hp:tbl)" +
    " and not(ancestor::hp:endNote) and not(ancestor::hp:footNote)]";
/**
 * A paragraph's own prose, with its equations in place.
 *
 * Built from the NODE rather than `Paragraph.toMarkdown()`, which cannot serve
 * here for two reasons. Its table branch returns before the equation branch, so
 * item 1 — whose stem sits beside the masthead table — loses its equation and
 * emits only "의 값은?". And it renders the masthead table itself, which is
 * running-head furniture rather than part of the question.
 */
function stemMarkdown(node) {
    let out = "";
    for (const run of (0, xml_1.findAll)(node, OWN_RUN)) {
        for (const child of Array.from(run.childNodes)) {
            if (child.nodeType !== 1)
                continue;
            if (child.localName === "t")
                out += child.textContent ?? "";
            else if (child.localName === "equation")
                out += math_node_1.MathNode.from(child).toMarkdown();
        }
    }
    return (0, latex_1.normaliseLatex)(out).trim();
}
/**
 * Groups a track's paragraphs into items.
 *
 * An item opens at a paragraph carrying an endNote and runs to the next one.
 * Everything before its first choice paragraph is stem; the rest are choices,
 * which a 수능 paper splits across the print column.
 */
function assembleItems(paragraphs, answerFor, binItems, fixtureBasename) {
    const starts = [];
    paragraphs.forEach((p, i) => {
        if ((0, xml_1.findAll)(p.node, ".//hp:endNote").length > 0)
            starts.push(i);
    });
    return starts.map((start, k) => {
        const end = starts[k + 1] ?? paragraphs.length;
        const slice = paragraphs.slice(start, end);
        const note = endnote_1.EndNote.from((0, xml_1.findAll)(slice[0].node, ".//hp:endNote")[0], binItems, fixtureBasename);
        const figures = [];
        const choices = [];
        let stem = "";
        for (const p of slice) {
            const { figure, rest } = (0, choices_1.splitLeadingFigure)(p.markdown);
            const asChoices = (0, choices_1.extractChoices)(p.markdown);
            if (asChoices) {
                if (figure)
                    figures.push(figure);
                choices.push(...asChoices);
                continue;
            }
            if (choices.length > 0)
                continue; // trailing furniture after the choices
            if (figure)
                figures.push(figure);
            const own = stemMarkdown(p.node);
            if (own !== "")
                stem = stem === "" ? own : `${stem}\n\n${own}`;
            void rest;
        }
        // One item in the corpus glues choice ① to the end of its stem paragraph,
        // so the recognised run starts at ②. Recover it rather than emit four
        // choices numbered 2-5.
        if (choices.length > 0 && choices[0].index !== 1) {
            const recovered = recoverFirstChoices(stem);
            if (recovered) {
                stem = recovered.stem;
                choices.unshift(...recovered.choices);
            }
        }
        const type = choices.length > 0 ? "multiple_choice" : "short_answer";
        const split = (0, answer_1.splitAnswerAndExplanation)(note.bodyMarkdown, {
            type,
            keyed: answerFor(note.number),
        });
        return {
            number: note.number,
            stem,
            figures,
            choices,
            type,
            answer: split.answer,
            explanation: split.explanation,
            mismatch: split.mismatch,
            images: note.images,
        };
    });
}
/** Splits a trailing `①…` run off a stem that swallowed its first choice. */
function recoverFirstChoices(stem) {
    const at = stem.indexOf("①");
    if (at < 0)
        return null;
    const choices = (0, choices_1.extractChoices)(stem.slice(at));
    return choices ? { stem: stem.slice(0, at).trim(), choices } : null;
}
//# sourceMappingURL=item.js.map