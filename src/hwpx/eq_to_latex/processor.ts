// Pre and post processing for equation strings
// Ported from lib/eq_to_latex/processor.rb

const HTML_ENTITIES: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
};

export class Processor {
  // Pre-process equation string before conversion
  preProcess(script: string): string {
    script = this.removeJokboWatermark(script);
    script = this.normalizeWhitespace(script);
    script = this.convertBackslashToRoman(script);
    script = this.decodeHtmlEntities(script);
    script = this.convertSubscriptSuperscript(script);
    return script;
  }

  // Post-process equation string after conversion
  postProcess(script: string): string {
    return this.normalizeWhitespace(script);
  }

  private removeJokboWatermark(script: string): string {
    return script.replace(/from\s*=+\s*(?:족보닷컴[\s\S]*?)=+/g, "");
  }

  private normalizeWhitespace(script: string): string {
    return script.replace(/\s+/g, " ").trim();
  }

  // Convert a lone backslash to \rm (Roman-mode escape).
  // In Hangul equation source, "\" alone marks a transition into Roman
  // (non-italic) text mode. The negative-lookahead (?![a-zA-Z]) ensures
  // we only convert genuinely-lone backslashes, NOT LaTeX commands like
  // \sqrt, \dfrac, \frac that earlier pipeline stages have already emitted.
  // JS needs `m` flag for line-start `^` to match within the string.
  convertBackslashToRoman(script: string): string {
    return script.replace(/(^|\s)\\(?![a-zA-Z])/gm, (_m, prefix) => `${prefix}\\rm `);
  }

  private decodeHtmlEntities(script: string): string {
    return Object.entries(HTML_ENTITIES).reduce(
      (s, [entity, char]) => s.replace(new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), char),
      script
    );
  }

  private convertSubscriptSuperscript(script: string): string {
    return script.replace(/_/g, " sub ").replace(/\^/g, " sup ");
  }
}
