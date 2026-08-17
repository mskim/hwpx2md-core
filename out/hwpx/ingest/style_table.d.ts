export declare class StyleTable {
    private readonly names;
    private constructor();
    static empty(): StyleTable;
    static fromHeader(headerDoc: Document): StyleTable;
    nameFor(id: string): string | undefined;
    headingLevelFor(id: string): number | undefined;
}
