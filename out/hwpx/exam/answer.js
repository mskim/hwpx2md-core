"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitAnswerAndExplanation = splitAnswerAndExplanation;
const CIRCLED = "①②③④⑤";
/**
 * The source label some papers print before the answer, e.g. `22_11_실전 2) `
 * or `23_09 교육 1) `.
 *
 * The separator after the month is an underscore in eight files and a SPACE in
 * one, so a pattern requiring `\d{2}_\d{2}_` silently misses all 46 endnotes of
 * `9ff4ba0f`. One endnote omits the number entirely — `23_09 교육 ) 62`.
 */
const SOURCE_LABEL = /^\d{2}[_ ]\d{2}[_ ]?[^)]*\)\s*/;
/** A figure can sit ahead of the answer — `![](…)$$127$$[출제의도]…`. */
const LEADING_FIGURE = /^!\[[^\]]*\]\([^)]*\)\s*/;
/** One paper labels the parts explicitly: `[정답] $$24$$[해설]…`. */
const ANSWER_LABEL = /^\[\s*정답\s*\]\s*/;
const EXPLANATION_LABEL = /^\[\s*해설\s*\]\s*/;
/**
 * The 단답형 answer at the start of a body, bare or wrapped in an equation.
 *
 * Two items in the corpus carry it as `$$127$$` rather than `127`, because HWP
 * stored the digits in an hp:equation. Matching only bare digits reports those
 * as unverifiable, which is a false alarm on a correct item.
 */
function leadingValue(text) {
    const eq = /^\$\$(\d+)\$\$/.exec(text);
    if (eq)
        return { digits: eq[1], rest: text.slice(eq[0].length) };
    const bare = /^\d+/.exec(text);
    return bare ? { digits: bare[0], rest: text.slice(bare[0].length) } : { digits: "", rest: text };
}
/**
 * Separates an item's answer from its worked solution.
 *
 * There is no separator in the source: the answer runs straight into the 해설.
 * For multiple choice the leading ①-⑤ is an unambiguous boundary. For 단답형 it
 * is undecidable from the text — `30) 100이므로` parses as 1, 10 or 100 — so the
 * printed answer key decides and the body serves only as a cross-check.
 *
 * A disagreement is REPORTED, never resolved silently. The corpus contains two
 * genuine ones where the paper's own key and its endnote differ.
 */
function splitAnswerAndExplanation(body, opts) {
    const text = body
        .trim()
        .replace(SOURCE_LABEL, "")
        .replace(LEADING_FIGURE, "")
        .replace(ANSWER_LABEL, "")
        .trim();
    if (opts.type === "multiple_choice") {
        const marker = CIRCLED.indexOf(text[0] ?? "");
        if (marker < 0) {
            return { answer: "", explanation: text, mismatch: "no ①-⑤ answer in the body" };
        }
        return { answer: String(marker + 1), explanation: text.slice(1).trim(), mismatch: null };
    }
    const keyed = opts.keyed ?? "";
    const { digits: leading, rest } = leadingValue(text);
    const tail = (s) => s.replace(EXPLANATION_LABEL, "").trim();
    // Trust the key for the value; use the body only to decide how much to strip
    // and whether the two agree.
    if (keyed !== "" && leading === keyed) {
        return { answer: keyed, explanation: tail(rest), mismatch: null };
    }
    return {
        answer: keyed,
        explanation: tail(rest),
        mismatch: leading === ""
            ? "no leading digits in the body to check the key against"
            : `key says ${keyed}, body starts ${leading}`,
    };
}
//# sourceMappingURL=answer.js.map