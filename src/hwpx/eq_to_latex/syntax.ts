// Syntax definitions for converting Hangul equation script to LaTeX
// Mechanically ported from lib/eq_to_latex/syntax.rb

export interface Rule {
  regex: string | string[];
  latex: string;
  alphabetic: boolean;
}

// Helper: create case-variation rules (lowercase, Titlecase, UPPERCASE)
function ci(word: string, latex: string): Rule {
  return { regex: [word.toLowerCase(), word[0].toUpperCase() + word.slice(1).toLowerCase(), word.toUpperCase()], latex, alphabetic: true };
}

function rule(regex: string | string[], latex: string, alphabetic = true): Rule {
  return { regex, latex, alphabetic };
}

// ============================================================
// KEYWORD COMMANDS - No parameters
// ============================================================
export const KEYWORD_COMMANDS: Rule[] = [
  ci("eqalign", ""),
  ci("rm", " \\rm "),
  ci("it", " \\it "),
  ci("sum", " \\sum "),
  rule(["int(?!er)", "Int(?!er)", "INT(?!ER)"], " \\int "),
  ci("oint", " \\oint "),
];

// ============================================================
// DEFAULT COMMANDS - One right-hand parameter
// ============================================================
export const DEFAULT_COMMANDS: Rule[] = [
  rule("sub(?!set)", "_"),
  rule("sup(?!set)", "^"),
  rule("box", "\\fbox"),
  rule("arch", "\\stackrel\\frown"),
  rule("bar", "\\overline"),
  rule("overline", "\\overline"),
  rule("acute", "\\acute"),
  rule("grave", "\\grave"),
  rule("check", "\\check"),
  rule("breve", "\\breve"),
  rule("tilde", "\\tilde"),
  rule("hat", "\\hat"),
  rule("widehat", "\\widehat"),
  rule("vec", "\\vec"),
  rule("dot(?!eq)", "\\dot"),
  rule("ddot(?!s)", "\\ddot"),
  rule("dyad", "\\overleftrightarrow"),
  rule("under", "\\underline"),
];

// ============================================================
// BLOCK COMMANDS - begin/end environments
// ============================================================
export const BLOCK_COMMANDS: Rule[] = [
  rule("cases", "cases"),
  rule("dmatrix", "vmatrix"),
  rule("bmatrix", "Bmatrix"),
  rule("pmatrix", "pmatrix"),
  rule("matrix", "matrix"),
];

// ============================================================
// META - Special characters and delimiters
// ============================================================
export const META: Rule[] = [
  // left/right without following bracket - remove
  rule('(?<![a-zA-Z])(?:left|right|LEFT|RIGHT|Left|Right)\\b\\s*(?:(?=[^{}\\[\\]\\|\\(\\)<>])|(?:$))', "", false),
  // Angle brackets
  rule('(?<![a-zA-Z])(?:left|LEFT|Left)\\s*<', " \\langle ", false),
  rule('(?<![a-zA-Z])(?:right|RIGHT|Right)\\s*>', " \\rangle ", false),
  // Square brackets
  rule('(?<![a-zA-Z])(?:left|LEFT|Left)\\s*\\[', " \\left [ ", false),
  rule('(?<![a-zA-Z])(?:right|RIGHT|Right)\\s*\\]', " \\right ] ", false),
  // Curly braces
  rule('(?<![a-zA-Z])(?:left|LEFT|Left)\\s*\\{', " \\{ ", false),
  rule('(?<![a-zA-Z])(?:right|RIGHT|Right)\\s*\\}', " \\} ", false),
  rule('"\\{"', " \\{ ", false),
  rule('"\\}"', " \\} ", false),
  // Parentheses
  rule('(?<![a-zA-Z])(?:left|LEFT|Left)\\s*\\(', " \\left ( ", false),
  rule('(?<![a-zA-Z])(?:right|RIGHT|Right)\\s*\\)', " \\right ) ", false),
  // Vertical bars
  rule('(?<![a-zA-Z])(?:left|LEFT|Left)\\s*\\|', " \\left | ", false),
  rule('(?<![a-zA-Z])(?:right|RIGHT|Right)\\s*\\|', " \\right | ", false),
  // Special characters
  rule("`", " \\, ", false),            // thin space
  rule("#", "\\\\\\\\", false),         // line break
  rule("&amp;", "", false),             // alignment
  rule("\\r?\\n", "", false),           // newlines
  rule("%", " \\% "),                   // percent
];

// ============================================================
// GREEK LETTERS
// ============================================================
const GREEK_LETTERS: Rule[] = [
  // Lowercase Greek
  rule("alpha", " \\alpha "),
  rule("beta", " \\beta "),
  rule("gamma", " \\gamma "),
  rule("delta", " \\delta "),
  rule("epsilon", " \\epsilon "),
  rule("zeta", " \\zeta "),
  rule("eta", " \\eta "),
  rule("theta", " \\theta "),
  rule("iota", " \\iota "),
  rule("kappa", " \\kappa "),
  rule("lambda", " \\lambda "),
  rule("mu", " \\mu "),
  rule("nu", " \\nu "),
  rule("xi", " \\xi "),
  rule("omicron", " \\omicron "),
  rule("pi", " \\pi "),
  rule("rho", " \\rho "),
  rule("sigma", " \\sigma "),
  rule("tau", " \\tau "),
  rule("upsilon", " \\upsilon "),
  rule("phi", " \\phi "),
  rule("chi", " \\chi "),
  rule("psi", " \\psi "),
  rule("omega", " \\omega "),
  // Uppercase Greek (with LaTeX commands)
  rule(["Gamma", "GAMMA"], " \\Gamma "),
  rule(["Delta", "DELTA"], " \\Delta "),
  rule(["Theta", "THETA"], " \\Theta "),
  rule(["Lambda", "LAMBDA"], " \\Lambda "),
  rule(["Xi", "XI"], " \\Xi "),
  rule(["Pi", "PI"], " \\Pi "),
  rule(["Sigma", "SIGMA"], " \\Sigma "),
  rule(["Phi", "PHI"], " \\Phi "),
  rule(["Psi", "PSI"], " \\Psi "),
  rule(["Omega", "OMEGA"], " \\Omega "),
  // Uppercase Greek (italic, no LaTeX command)
  rule(["Alpha", "ALPHA"], " \\mathit {A} "),
  rule(["Beta", "BETA"], " \\mathit {B} "),
  rule(["Epsilon", "EPSILON"], "\\mathit {E}"),
  rule(["Zeta", "ZETA"], "\\mathit {Z}"),
  rule(["Eta", "ETA"], "\\mathit {H}"),
  rule(["Iota", "IOTA"], "\\mathit {I}"),
  rule(["Kappa", "KAPPA"], "\\mathit {K}"),
  rule(["Mu", "MU"], "\\mathit {M}"),
  rule(["Nu", "NU"], "\\mathit {N}"),
  rule(["Omicron", "OMICRON"], " \\mathit {O} "),
  rule(["Rho", "RHO"], "\\mathit {P}"),
  rule(["Tau", "TAU"], "\\mathit {T}"),
  rule(["Upsilon", "UPSILON"], "\\mathit {Y}"),
  rule(["Chi", "CHI"], "\\mathit {X}"),
  // Variant forms
  rule("vartheta", " \\vartheta "),
  rule("varpi", " \\varpi "),
  rule("varsigma", " \\varsigma "),
  rule("varupsilon", " \\Upsilon "),
  rule("varphi", " \\varphi "),
  rule("varepsilon", " \\varepsilon "),
  rule("varrho", " \\varrho "),
];

// ============================================================
// SPECIAL SYMBOLS
// ============================================================
const SPECIAL_SYMBOLS: Rule[] = [
  ci("aleph", " \\aleph "),
  ci("hbar", " \\hbar "),
  ci("imath", " \\imath "),
  ci("jmath", " \\jmath "),
  ci("ell", " \\ell "),
  ci("liter", " \\ell "),
  ci("wp", " \\wp "),
  ci("mho", " \\mho "),
  rule("IMAG", " \\Im "),
  rule("ANGSTROM", " \\mathit {\\unicode{x212b}} "),
  rule("prime", " ' "),
];

// ============================================================
// SET OPERATIONS
// ============================================================
const SET_OPERATIONS: Rule[] = [
  rule(["prod", "PROD"], " \\prod "),
  ci("coprod", " \\coprod "),
  ci("inter", " \\bigcap "),
  ci("bigcap", " \\bigcap "),
  ci("union", " \\bigcup "),
  ci("bigcup", " \\bigcup "),
  ci("cap", " \\cap "),
  ci("smallinter", " \\cap "),
  ci("cup", " \\cup "),
  ci("smallunion", " \\cup "),
  ci("sqcap", " \\sqcap "),
  ci("sqcup", " \\sqcup "),
  ci("bigsqcup", " \\bigsqcup "),
  ci("uplus", " \\uplus "),
  ci("biguplus", " \\biguplus "),
  ci("subset", " \\subset "),
  ci("supset", " \\supset "),
  ci("subseteq", " \\subseteq "),
  ci("supseteq", " \\supseteq "),
  ci("nsubseteq", " \\nsubseteq "),
  ci("nsupseteq", " \\nsupseteq "),
  ci("sqsubset", " \\sqsubset "),
  ci("sqsupset", " \\sqsupset "),
  ci("sqsubseteq", " \\sqsubseteq "),
  ci("sqsupseteq", " \\sqsupseteq "),
  rule(["in(?!t|f)", "In(?!t|f)", "IN(?!T|F)"], " \\in "),
  rule(["not(?!in)", "Not(?!in)", "NOT(?!IN)"], " \\not "),
  ci("ni", " \\ni "),
  ci("owns", " \\owns "),
  ci("notin", " \\not \\in "),
  ci("nin", " \\not \\in "),
  ci("notni", " \\not \\ni "),
];

// ============================================================
// COMPARISON OPERATORS
// ============================================================
const COMPARISON_OPERATORS: Rule[] = [
  ci("leq", " \\leq "),
  ci("le", " \\le "),
  rule("<=", " \\leqq ", false),
  ci("geq", " \\geq "),
  ci("ge", " \\ge "),
  rule(">=", " \\geqq ", false),
  rule('(?<![>\\-])(?:(?<!\\s)>|>(?!\\s))(?![=>])', " > ", false),
  rule('(?<![s<])(?:(?<!\\s)<|<(?!\\s))(?![<=])', " < ", false),
  rule("(?<!<)<<(?!<)", " \\ll ", false),
  rule("(?<!>)>>(?!>)", " \\gg ", false),
  rule("<<<", " \\lll ", false),
  ci("lll", " \\lll "),
  rule(">>>", " \\ggg ", false),
  rule("ggg", " \\ggg "),
  rule(["prec", "PREC"], " \\prec "),
  ci("succ", " \\succ "),
];

// ============================================================
// BINARY OPERATORS
// ============================================================
const BINARY_OPERATORS: Rule[] = [
  rule("\\+\\-", " \\pm ", false),
  ci("plusminus", " \\pm "),
  rule("\\-\\+", " \\mp ", false),
  ci("minusplus", " \\mp "),
  ci("dsum", " \\dotplus "),
  ci("times", " \\times "),
  ci("divide", " \\div "),
  ci("div", " \\div "),
  ci("circ", " \\circ "),
  ci("bullet", " \\bullet "),
  rule(["Deg", "DEG"], " \\,^{\\circ} "),
  ci("ast", " \\ast "),
  ci("star", " \\star "),
  ci("bigcirc", " \\bigcirc "),
  ci("oplus", " \\oplus "),
  ci("ominus", " \\ominus "),
  ci("otimes", " \\otimes "),
  ci("odot", " \\odot "),
  ci("oslash", " \\oslash "),
];

// ============================================================
// LOGICAL OPERATORS
// ============================================================
const LOGICAL_OPERATORS: Rule[] = [
  ci("lor", " \\lor "),
  ci("vee", " \\vee "),
  ci("bigvee", " \\bigvee "),
  ci("land", " \\land "),
  ci("wedge", " \\wedge "),
  ci("bigwedge", " \\bigwedge "),
  ci("xor", " \\veebar "),
  rule(["LNOT"], " \\lnot "),
  ci("neg", " \\neg "),
];

// ============================================================
// RELATION SYMBOLS
// ============================================================
const RELATION_SYMBOLS: Rule[] = [
  ci("ne", " \\ne "),
  rule("!=", " \\ne ", false),
  ci("neq", " \\neq "),
  ci("doteq", " \\doteq "),
  rule(["image", "Image"], " \\fallingdotseq "),
  ci("reimage", " \\risingdotseq "),
  ci("sim", " \\backsim "),
  rule("∾", " \\backsim ", false),
  rule("\xf3\xb0\x81\x80", " \\backsim ", false),
  ci("simeq", " \\simeq "),
  ci("approx", " \\approx "),
  ci("cong", " \\cong "),
  ci("equiv", " \\equiv "),
  rule("==", " \\equiv ", false),
  ci("asymp", " \\asymp "),
  ci("iso", " \\Bumpeq "),
  ci("propto", " \\propto "),
];

// ============================================================
// MISCELLANEOUS SYMBOLS
// ============================================================
const MISC_SYMBOLS: Rule[] = [
  ci("emptyset", " \\emptyset "),
  ci("therefore", " \\therefore "),
  ci("because", " \\because "),
  rule(["exists?", "Exists?", "EXISTS?"], " \\exists "),
  ci("diamond", " \\diamond "),
  rule(["Forall", "FORALL"], " \\forall "),
  ci("partial", " \\partial "),
  ci("infty", " \\infty "),
  ci("inf", " \\infty "),
  ci("infinity", " \\infty "),
  ci("dagger", " \\dagger "),
  ci("ddagger", " \\ddagger "),
  ci("parallel", " \\parallel "),
];

// ============================================================
// ARROWS
// ============================================================
const ARROWS: Rule[] = [
  rule(["larrow", "leftarrow"], " \\leftarrow "),
  rule(["Leftarrow", "LEFTARROW", "LARROW", "Larrow"], " \\Leftarrow "),
  rule(["rarrow", "rightarrow"], " \\rightarrow "),
  rule(["Rightarrow", "RIGHTARROW", "RARROW", "Rarrow"], " \\Rightarrow "),
  rule("uparrow", " \\uparrow "),
  rule(["Uparrow", "UPARROW"], " \\Uparrow "),
  rule("downarrow", " \\downarrow "),
  rule(["Downarrow", "DOWNARROW"], " \\Downarrow "),
  rule("udarrow", " \\updownarrow "),
  rule(["Udarrow", "UDARROW"], " \\Updownarrow "),
  rule("lrarrow", " \\leftrightarrow "),
  rule(["Lrarrow", "LRARROW"], " \\Leftrightarrow "),
  ci("nwarrow", " \\nwarrow "),
  ci("searrow", " \\searrow "),
  ci("nearrow", " \\nearrow "),
  ci("swarrow", " \\swarrow "),
  ci("hookleft", " \\hookleftarrow "),
  ci("hookright", " \\hookrightarrow "),
  ci("mapsto", " \\mapsto "),
  rule("->", " \\to ", false),
];

// ============================================================
// DELIMITERS AND DOTS
// ============================================================
const DELIMITERS: Rule[] = [
  rule(["Vert", "VERT"], " \\Vert "),
  rule("vert", " \\vert "),
  ci("backslash", " \\backslash "),
  rule(["cdot(?!s)", "Cdot(?!s)", "CDOT(?!S)"], " \\cdot "),
  ci("cdots", " \\cdots "),
  ci("ldots", " \\ldots "),
  ci("vdots", " \\vdots "),
  ci("ddots", " \\ddots "),
];

// ============================================================
// GEOMETRY SYMBOLS
// ============================================================
const GEOMETRY_SYMBOLS: Rule[] = [
  rule(["triangle(?![dlr])", "Triangle(?![dlr])", "TRIANGLE(?![DLR])"], " \\triangle "),
  ci("triangled", " \\triangledown "),
  ci("trianglel", " \\triangleleft "),
  ci("triangler", " \\triangleright "),
  ci("nabla", " \\nabla "),
  ci("angle", " \\angle "),
  ci("langle", " \\langle "),
  ci("rangle", " \\rangle "),
  ci("msangle", " \\measuredangle "),
  ci("sangle", " \\sphericalangle "),
  ci("vdash", " \\vdash "),
  ci("hright", " \\vdash "),
  ci("dashv", " \\dashv "),
  ci("hleft", " \\dashv "),
  ci("bot", " \\bot "),
  ci("top", " \\top "),
  rule(["Models", "MODELS"], " \\models "),
  ci("laplace", " \\mathscr {L} "),
  ci("centigrade", " \\,^{\\circ}\\mathrm {C} "),
  ci("fahrenheit", " \\,^{\\circ}\\mathrm {F} "),
  ci("amalg", " \\amalg "),
  ci("lfloor", " \\lfloor "),
  ci("rfloor", " \\rfloor "),
  ci("lceil", " \\lceil "),
  ci("rceil", " \\rceil "),
];

// ============================================================
// RESERVED WORDS - Function names (rendered in Roman font)
// ============================================================
export const RESERVED_WORD: Rule[] = [
  // Trigonometric functions
  rule('(?<!mathrm\\s{)sin(?!h)', " \\mathrm {sin} "),
  rule('(?<!mathrm\\s{)cos(?!ec|h)', " \\mathrm {cos} "),
  rule('(?<!mathrm\\s{)tan(?!h)', " \\mathrm {tan} "),
  rule('(?<!mathrm\\s{)cot(?!h)', " \\mathrm {cot} "),
  rule('(?<!mathrm\\s{)sec', " \\mathrm {sec} "),
  rule('(?<!mathrm\\s{)cosec', " \\mathrm {cosec} "),
  rule('(?<!mathrm\\s{)csc', " \\mathrm {csc} "),
  // Inverse trig
  rule('(?<!mathrm\\s{)arcsin', " \\mathrm {arcsin} "),
  rule('(?<!mathrm\\s{)arccos', " \\mathrm {arccos} "),
  rule('(?<!mathrm\\s{)arctan', " \\mathrm {arctan} "),
  rule('(?<!mathrm\\s{)arc(?!h|sin|cos|tan)', " \\mathrm {arc} "),
  // Hyperbolic functions
  rule('(?<!mathrm\\s{)sinh', " \\mathrm {sinh} "),
  rule('(?<!mathrm\\s{)cosh', " \\mathrm {cosh} "),
  rule('(?<!mathrm\\s{)tanh', " \\mathrm {tanh} "),
  rule('(?<!mathrm\\s{)coth', " \\mathrm {coth} "),
  // Logarithms
  rule('(?<!mathrm\\s{)log', " \\mathrm {log} "),
  rule('(?<!mathrm\\s{)ln(?!ot)', " \\mathrm {ln} "),
  rule('(?<!mathrm\\s{)lg', " \\mathrm {lg} "),
  rule('(?<!mathrm\\s{)exp', " \\mathrm {exp} "),
  rule('(?<!mathrm\\s{)Exp', " \\mathrm {Exp} "),
  // Limits and special functions
  rule('(?<!mathrm\\s{)lim', " \\mathrm {lim} "),
  rule('(?<!mathrm\\s{)Lim', " \\mathrm {Lim} "),
  rule('(?<!mathrm\\s{)max', " \\mathrm {max} "),
  rule('(?<!mathrm\\s{)min', " \\mathrm {min} "),
  rule('(?<!mathrm\\s{)det', " \\mathrm {det} "),
  rule('(?<!mathrm\\s{)gcd', " \\mathrm {gcd} "),
  rule('(?<!mathrm\\s{)mod', " \\mathrm {mod} "),
  // Keywords
  rule('(?<!mathrm\\s{)if', " \\mathrm {if} "),
  rule('(?<!mathrm\\s{)for', " \\mathrm {for} "),
  rule('(?<!mathrm\\s{)and', " \\mathrm {and} "),
  // Algebra
  rule('(?<!mathrm\\s{)hom', " \\mathrm {hom} "),
  rule('(?<!mathrm\\s{)ker', " \\mathrm {ker} "),
  rule('(?<!mathrm\\s{)deg', " \\mathrm {deg} "),
  rule('(?<!mathrm\\s{)arg', " \\mathrm {arg} "),
  rule('(?<!mathrm\\s{)dim', " \\mathrm {dim} "),
  rule('(?<!mathrm\\s{)Pr', " \\mathrm {Pr} "),
];

// Combined symbol list for simple replacement
export const SYMBOL: Rule[] = [
  ...GREEK_LETTERS,
  ...SPECIAL_SYMBOLS,
  ...SET_OPERATIONS,
  ...COMPARISON_OPERATORS,
  ...BINARY_OPERATORS,
  ...LOGICAL_OPERATORS,
  ...RELATION_SYMBOLS,
  ...MISC_SYMBOLS,
  ...ARROWS,
  ...DELIMITERS,
  ...GEOMETRY_SYMBOLS,
];
