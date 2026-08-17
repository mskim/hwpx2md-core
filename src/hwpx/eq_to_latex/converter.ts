// Converts Korean Hangul equation script to LaTeX syntax
// Ported from lib/eq_to_latex/converter.rb

import { Processor } from "./processor";
import { Rule, KEYWORD_COMMANDS, DEFAULT_COMMANDS, BLOCK_COMMANDS, META, SYMBOL, RESERVED_WORD } from "./syntax";

export type WrapMode = "display" | "inline" | "none";

// Returns end index (exclusive) of balanced {...} starting at `start`, or -1 if no match.
function readBalancedBraces(s: string, start: number): number {
  if (s[start] !== "{") return -1;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

// Read a non-brace token (up to 9 non-whitespace, non-brace, non-backtick chars)
function readToken(s: string, start: number): number {
  if (start >= s.length) return -1;
  if (s[start] === "{") return -1;
  let i = start;
  let count = 0;
  while (i < s.length && count < 9 && s[i] !== " " && s[i] !== "\t" && s[i] !== "\n" && s[i] !== "{" && s[i] !== "}" && s[i] !== "`") {
    i++;
    count++;
  }
  if (i === start) return -1;
  return i;
}

// Strip surrounding braces from a term
function stripBraces(term: string): string {
  if (term.startsWith("{") && term.endsWith("}")) {
    return term.slice(1, -1);
  }
  return term;
}

// Build a regex pattern from a Rule (mirrors build_rule_regex in Ruby)
function buildRuleRegex(r: Rule): RegExp {
  const patterns = Array.isArray(r.regex) ? r.regex : [r.regex];
  const prefix = r.alphabetic ? "(?<![a-zA-Z\\\\])" : "(?<![\\\\])";
  return new RegExp(`${prefix}(${patterns.join("|")})`, "g");
}

// Sort rules by max pattern length (descending) — mirrors sort_by_length in Ruby
function sortByLength(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    const lenA = Array.isArray(a.regex) ? Math.max(...a.regex.map((x) => x.length)) : a.regex.length;
    const lenB = Array.isArray(b.regex) ? Math.max(...b.regex.map((x) => x.length)) : b.regex.length;
    return lenB - lenA;
  });
}

export class Converter {
  private processor = new Processor();
  private sortedKeywords: Rule[];
  private sortedSymbols: Rule[];

  constructor() {
    this.sortedKeywords = sortByLength(KEYWORD_COMMANDS);
    this.sortedSymbols = sortByLength([...META, ...SYMBOL, ...RESERVED_WORD]);
  }

  /**
   * Convert Hangul equation script to LaTeX.
   * @param wrap - "display" wraps in $$...$$, "inline" in $...$ (or bare), "none" returns raw.
   * @param dollarSign - When wrap is "inline", whether to wrap in $...$ (default true).
   */
  convert(script: string, opts: { wrap?: WrapMode; dollarSign?: boolean } = {}): string {
    const wrap = opts.wrap ?? "inline";
    const dollarSign = opts.dollarSign ?? true;

    let result = this.processor.preProcess(script);
    result = this.applyKeywordCommands(result);
    result = this.applyUnaryCommands(result);
    result = this.applyBlockCommands(result);
    result = this.applySqrt(result);
    result = this.applyFractions(result);
    result = this.applySymbolReplacements(result);
    result = this.processor.postProcess(result);

    switch (wrap) {
      case "display": return `$$${result}$$`;
      case "inline":  return dollarSign ? `$${result}$` : result;
      case "none":    return result;
    }
  }

  // Keep applying replacements until no more matches
  private replaceUntilStable(script: string, rules: Rule[]): string {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let changed = false;
      for (const r of rules) {
        const regex = buildRuleRegex(r);
        const newScript = script.replace(regex, r.latex);
        if (newScript !== script) {
          script = newScript;
          changed = true;
        }
      }
      if (!changed) break;
    }
    return script;
  }

  // Apply keyword commands (no parameters, simple replacements like sum, int)
  private applyKeywordCommands(script: string): string {
    return this.replaceUntilStable(script, this.sortedKeywords);
  }

  // Apply unary commands (one right-hand parameter like sub, sup, bar)
  private applyUnaryCommands(script: string): string {
    for (const cmd of DEFAULT_COMMANDS) {
      script = this.applyUnaryCommand(script, cmd);
    }
    return script;
  }

  private applyUnaryCommand(script: string, cmd: Rule): string {
    const patterns = Array.isArray(cmd.regex) ? cmd.regex : [cmd.regex];
    const cmdPattern = new RegExp(`(?<![a-zA-Z\\\\])(?:${patterns.join("|")})`, "i");

    while (true) {
      // Find the command in the script
      const match = cmdPattern.exec(script);
      if (!match) break;

      const cmdEnd = match.index + match[0].length;

      // Skip whitespace after command
      let pos = cmdEnd;
      while (pos < script.length && (script[pos] === " " || script[pos] === "\t")) pos++;

      // Read the term (balanced braces or token)
      let termEnd: number;
      if (script[pos] === "{") {
        termEnd = readBalancedBraces(script, pos);
        if (termEnd === -1) break;
      } else {
        termEnd = readToken(script, pos);
        if (termEnd === -1) break;
      }

      const termRaw = script.slice(pos, termEnd);
      const term = stripBraces(termRaw);

      const before = script.slice(0, match.index);
      const after = script.slice(termEnd);
      script = `${before} ${cmd.latex} {${term}} ${after}`;
    }
    return script;
  }

  // Apply block commands (matrix, cases - use \begin{} \end{})
  private applyBlockCommands(script: string): string {
    for (const cmd of BLOCK_COMMANDS) {
      script = this.applyBlockCommand(script, cmd);
    }
    return script;
  }

  private applyBlockCommand(script: string, cmd: Rule): string {
    const patterns = Array.isArray(cmd.regex) ? cmd.regex : [cmd.regex];
    const cmdPattern = new RegExp(`(?<![a-zA-Z])(?:${patterns.join("|")})`, "i");

    while (true) {
      const match = cmdPattern.exec(script);
      if (!match) break;

      const cmdEnd = match.index + match[0].length;

      // Skip whitespace after command
      let pos = cmdEnd;
      while (pos < script.length && (script[pos] === " " || script[pos] === "\t")) pos++;

      // Require balanced braces for block commands
      if (script[pos] !== "{") break;
      const termEnd = readBalancedBraces(script, pos);
      if (termEnd === -1) break;

      const termRaw = script.slice(pos, termEnd);
      const content = stripBraces(termRaw);

      const before = script.slice(0, match.index);
      const after = script.slice(termEnd);
      const replacement = ` \\begin{${cmd.latex}} ${content} \\end{${cmd.latex}} `;
      script = `${before}${replacement}${after}`;
    }
    return script;
  }

  // Apply sqrt/root conversion: sqrt A => \sqrt{A}, sqrt A of B => \sqrt[A]{B}
  private applySqrt(script: string): string {
    const sqrtPattern = /(?<!\\)(?:sqrt|root|SQRT|ROOT|Sqrt|Root)/i;

    while (true) {
      const match = sqrtPattern.exec(script);
      if (!match) break;

      const cmdEnd = match.index + match[0].length;

      // Skip whitespace
      let pos = cmdEnd;
      while (pos < script.length && (script[pos] === " " || script[pos] === "\t")) pos++;

      // Read first term (base in source, becomes index in LaTeX when "of" follows)
      let baseEnd: number;
      if (script[pos] === "{") {
        baseEnd = readBalancedBraces(script, pos);
        if (baseEnd === -1) break;
      } else {
        baseEnd = readToken(script, pos);
        if (baseEnd === -1) break;
      }

      const baseRaw = script.slice(pos, baseEnd);
      const baseTerm = stripBraces(baseRaw);

      // Check for "of" keyword
      let afterBase = baseEnd;
      while (afterBase < script.length && (script[afterBase] === " " || script[afterBase] === "\t")) afterBase++;

      const ofMatch = /^(?:of|OF|Of)/i.exec(script.slice(afterBase));
      let replacement: string;
      let totalEnd: number;

      if (ofMatch) {
        const ofEnd = afterBase + ofMatch[0].length;
        let indexPos = ofEnd;
        while (indexPos < script.length && (script[indexPos] === " " || script[indexPos] === "\t")) indexPos++;

        let indexEnd: number;
        if (script[indexPos] === "{") {
          indexEnd = readBalancedBraces(script, indexPos);
          if (indexEnd === -1) break;
        } else {
          indexEnd = readToken(script, indexPos);
          if (indexEnd === -1) break;
        }

        const indexRaw = script.slice(indexPos, indexEnd);
        const indexTerm = stripBraces(indexRaw);

        // sqrt A of B → \sqrt[A]{B} (A is the index, B is the radicand)
        replacement = `\\sqrt[${baseTerm}]{${indexTerm}}`;
        totalEnd = indexEnd;
      } else {
        replacement = `\\sqrt{${baseTerm}}`;
        totalEnd = baseEnd;
      }

      const before = script.slice(0, match.index);
      const after = script.slice(totalEnd);
      script = `${before}${replacement}${after}`;
    }
    return script;
  }

  // Apply fraction conversion: A over B => \dfrac{A}{B}
  private applyFractions(script: string): string {
    // Match "over" or "atop" (not "overline")
    const overPattern = /(?<!\\)(?:over(?!line)|atop)/i;

    while (true) {
      const match = overPattern.exec(script);
      if (!match) break;

      const overStart = match.index;
      const overEnd = overStart + match[0].length;

      // Find left term: scan backward from overStart
      let ltEnd = overStart;
      // Skip whitespace to the left
      while (ltEnd > 0 && (script[ltEnd - 1] === " " || script[ltEnd - 1] === "\t")) ltEnd--;

      let ltStart: number;
      if (ltEnd > 0 && script[ltEnd - 1] === "}") {
        // Find matching opening brace
        let depth = 0;
        let i = ltEnd - 1;
        while (i >= 0) {
          if (script[i] === "}") depth++;
          else if (script[i] === "{") {
            depth--;
            if (depth === 0) { ltStart = i; break; }
          }
          i--;
        }
        if (ltStart! === undefined) break;
      } else {
        // Read token backward: up to 9 non-whitespace non-brace chars
        let i = ltEnd - 1;
        let count = 0;
        while (i >= 0 && count < 9 && script[i] !== " " && script[i] !== "\t" && script[i] !== "\n" && script[i] !== "{" && script[i] !== "}") {
          i--;
          count++;
        }
        ltStart = i + 1;
        if (ltStart >= ltEnd) break;
      }

      const leftRaw = script.slice(ltStart, ltEnd);
      const leftTerm = stripBraces(leftRaw);

      // Find right term: scan forward from overEnd
      let rtStart = overEnd;
      while (rtStart < script.length && (script[rtStart] === " " || script[rtStart] === "\t")) rtStart++;

      let rtEnd: number;
      if (script[rtStart] === "{") {
        rtEnd = readBalancedBraces(script, rtStart);
        if (rtEnd === -1) break;
      } else {
        rtEnd = readToken(script, rtStart);
        if (rtEnd === -1) break;
      }

      const rightRaw = script.slice(rtStart, rtEnd);
      const rightTerm = stripBraces(rightRaw);

      const before = script.slice(0, ltStart);
      const after = script.slice(rtEnd);
      script = `${before} \\dfrac {${leftTerm}}{${rightTerm}} ${after}`;
    }
    return script;
  }

  // Apply symbol and reserved word replacements
  private applySymbolReplacements(script: string): string {
    return this.replaceUntilStable(script, this.sortedSymbols);
  }
}
