/**
 * Wraps an hp:equation element. Converts the HWP equation source using the
 * EqToLatex converter (ported from Ruby). Falls back to a fenced
 * `hwp-equation` code block if conversion throws.
 */
export declare class MathNode {
    readonly source: string;
    private constructor();
    static from(node: Element): MathNode;
    toMarkdown(): string;
}
