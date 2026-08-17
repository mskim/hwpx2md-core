export type WrapMode = "display" | "inline" | "none";
export declare class Converter {
    private processor;
    private sortedKeywords;
    private sortedSymbols;
    constructor();
    /**
     * Convert Hangul equation script to LaTeX.
     * @param wrap - "display" wraps in $$...$$, "inline" in $...$ (or bare), "none" returns raw.
     * @param dollarSign - When wrap is "inline", whether to wrap in $...$ (default true).
     */
    convert(script: string, opts?: {
        wrap?: WrapMode;
        dollarSign?: boolean;
    }): string;
    private replaceUntilStable;
    private applyKeywordCommands;
    private applyUnaryCommands;
    private applyUnaryCommand;
    private applyBlockCommands;
    private applyBlockCommand;
    private applySqrt;
    private applyFractions;
    private applySymbolReplacements;
}
