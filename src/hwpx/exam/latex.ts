/**
 * Turns the converter's LaTeX into what a person would type.
 *
 * `EqToLatex` renders HWP's EQEDIT syntax faithfully rather than idiomatically,
 * so it emits `\mathrm {cos} \, \theta` where a human writes `\cos\theta`. That
 * matters because the same markdown is BOTH machine output and human input: a
 * teacher typing an exam and the converter reading one must produce comparable
 * files, or the round-trip that the whole convention rests on cannot hold.
 *
 * Measured over one paper's 336 distinct equations: space-after-macro 74,
 * injected `\,` 31, `_ {` 27, `^ {` 12, `\mathrm` 9, `~` 9, `{}` 2, and
 * `\rm`/`\it` 50 — the last of which KaTeX rejects outright.
 */

/** HWP writes these as upright text; LaTeX has a macro for each. */
const FUNCTIONS = [
  "lim", "log", "ln", "exp", "max", "min", "det", "gcd", "deg",
  "sin", "cos", "tan", "sec", "csc", "cot",
  "sinh", "cosh", "tanh",
  "arcsin", "arccos", "arctan",
];


export function normaliseLatex(src: string): string {
  return src.replace(/\$\$([\s\S]*?)\$\$/g, (_m, body: string) => `$$${normaliseBody(body)}$$`);
}

function normaliseBody(input: string): string {
  let out = input;

  // 1. Korean runs first. Inside math mode HWP separates Korean words with `\,`,
  //    so those thin spaces are the ONLY word boundary — dropping them later
  //    would give 이홀수인경우. Wrap the whole run, spaces and all, in one
  //    \text{}: a per-word wrap renders identically to no spaces at all.
  out = out.replace(
    new RegExp(`[\\uAC00-\\uD7A3](?:(?:\\s|\\\\,)*[\\uAC00-\\uD7A3])*`, "g"),
    (run) => `\\text{${run.replace(/\\,/g, " ").replace(/\s+/g, " ").trim()}}`,
  );

  // 2. `\mathrm {cos}` → `\cos`, for the functions LaTeX names itself.
  out = out.replace(/\\mathrm\s*\{\s*([a-z]+)\s*\}/g, (m, fn: string) =>
    FUNCTIONS.includes(fn) ? `\\${fn}` : m,
  );

  // 3. Empty groups: EQEDIT emits `{}` as a placeholder that means nothing here.
  out = out.replace(/\{\s*\}/g, "");

  // 4. Raw font switches. KaTeX has no `\rm` / `\it`, so these are not merely
  //    noisy — they fail to render.
  out = out.replace(/\\(rm|it)\b/g, " ");

  // 5. `~` is HWP's non-breaking space.
  out = out.replace(/~/g, " ");

  // 6. Thin spaces are injected spacing, not content — Korean already handled.
  out = out.replace(/\\,/g, " ");

  // 7. Collapse, then close up the places LaTeX does not want a space.
  out = out.replace(/\s+/g, " ");
  out = out.replace(/\s+([_^])/g, "$1");        // a _{8} → a_{8}
  out = out.replace(/([_^])\s+/g, "$1");        // _ {3} → _{3}
  out = out.replace(/\s+\{/g, "{");            // \dfrac {a} → \dfrac{a}, and } { → }{
  out = out.replace(/\s*([=+\-<>,])\s*/g, "$1"); // around operators
  // A comma or colon closes up on the left and keeps one space on the right,
  // the way it reads in prose: `f: X`, `(1, 2)`.
  out = out.replace(/\s*:\s*/g, ": ");
  out = out.replace(/,(\S)/g, ", $1");
  out = out.replace(/\s+([)\]}])/g, "$1");
  out = out.replace(/([([{])\s+/g, "$1");

  // 8. A macro keeps its space when a letter or DIGIT follows — `\to X`,
  //    `\to 0` — and loses it otherwise, since `\theta<0` needs none and
  //    `\dfrac{` would look wrong with one.
  out = out.replace(/(\\[a-zA-Z]+)\s+(?![a-zA-Z0-9])/g, "$1");

  return out.trim();
}
