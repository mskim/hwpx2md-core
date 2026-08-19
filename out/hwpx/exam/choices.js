"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractChoices = extractChoices;
exports.splitLeadingFigure = splitLeadingFigure;
const CIRCLED = "①②③④⑤";
/**
 * The choices in one paragraph, or null if this is not a choice paragraph.
 *
 * A 수능 paper lays five choices across the print column, so they arrive split
 * over more than one paragraph — 3+2 is the common shape but 1+1+1+1+1, 2+2+1
 * and all-five each occur. The caller accumulates until it has five.
 *
 * Requiring the paragraph to BEGIN with a circled numeral is what keeps a stem
 * out: one in the corpus carries a ② part way through its sentence, and
 * splitting on ①-⑤ wherever they appear would tear that question in half.
 */
function extractChoices(paragraph) {
    const text = stripWrappingBold(splitLeadingFigure(paragraph).rest);
    if (text === "" || !CIRCLED.includes(text[0]))
        return null;
    const out = [];
    let index = 0;
    let buffer = "";
    for (const ch of text) {
        const marker = CIRCLED.indexOf(ch);
        if (marker >= 0) {
            if (index > 0)
                out.push({ index, text: buffer.trim() });
            index = marker + 1;
            buffer = "";
            continue;
        }
        buffer += ch;
    }
    if (index > 0)
        out.push({ index, text: buffer.trim() });
    return out.length > 0 ? out : null;
}
/**
 * A figure sitting ahead of the first choice, and the text after it.
 *
 * A question's diagram often shares the paragraph that opens the choices, so
 * the emitted markdown reads `![](…)\n\n① $$-4$$`. Requiring the paragraph to
 * begin with a circled numeral would reject those — 3 to 4 items per paper —
 * and their choices would then arrive numbered 2,3,4,5.
 *
 * Returned rather than discarded: the figure belongs to the item, and the
 * assembler attaches it to the stem.
 */
function splitLeadingFigure(paragraph) {
    const m = /^\s*(!\[[^\]]*\]\([^)]*\))\s*/.exec(paragraph);
    return m
        ? { figure: m[1] ?? null, rest: paragraph.slice(m[0].length).trim() }
        : { figure: null, rest: paragraph.trim() };
}
/**
 * `**① ㄱ② ㄴ**` → `① ㄱ② ㄴ`.
 *
 * Only when the WHOLE paragraph is wrapped. Leaving it in place would put the
 * closing `**` on the last choice, so choice 5 would read `ㄴ, ㄷ**`.
 */
function stripWrappingBold(text) {
    return text.startsWith("**") && text.endsWith("**") && text.length > 4
        ? text.slice(2, -2).trim()
        : text;
}
//# sourceMappingURL=choices.js.map