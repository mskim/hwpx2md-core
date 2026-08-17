export declare class Processor {
    preProcess(script: string): string;
    postProcess(script: string): string;
    private removeJokboWatermark;
    private normalizeWhitespace;
    convertBackslashToRoman(script: string): string;
    private decodeHtmlEntities;
    private convertSubscriptSuperscript;
}
