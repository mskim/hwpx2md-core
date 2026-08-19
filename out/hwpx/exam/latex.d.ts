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
export declare function normaliseLatex(src: string): string;
