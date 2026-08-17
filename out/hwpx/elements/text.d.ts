/**
 * Thin wrapper over an hp:t element's text content. Mirrors Ruby's
 * `Hwpx2md::Elements::Text#content`. Read-only — we never write HWPX.
 */
export declare class Text {
    readonly content: string;
    private constructor();
    static from(node: Element): Text;
}
