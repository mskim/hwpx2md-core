export interface Rule {
    regex: string | string[];
    latex: string;
    alphabetic: boolean;
}
export declare const KEYWORD_COMMANDS: Rule[];
export declare const DEFAULT_COMMANDS: Rule[];
export declare const BLOCK_COMMANDS: Rule[];
export declare const META: Rule[];
export declare const RESERVED_WORD: Rule[];
export declare const SYMBOL: Rule[];
