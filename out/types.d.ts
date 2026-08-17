/**
 * The public surface of hwpx2md-core.
 *
 * There is one engine: the native TypeScript OWPML parser under `src/hwpx/`.
 * An earlier version of this interface also covered a Ruby-subprocess engine,
 * which is why `convert` takes a path rather than a Buffer — see below.
 *
 * Keep this interface minimal. Adding fields here means updating every
 * implementation. If a feature only applies to one engine, hide it there.
 */
export interface Converter {
    /** Name used in logs and user-facing error messages. */
    readonly name: string;
    /**
     * Convert a source document to Markdown. The implementation is responsible
     * for reading the file at `sourcePath`.
     *
     * The path-not-Buffer signature is inherited from the Ruby-subprocess engine,
     * which streamed the file on the Ruby side. That engine is gone; the signature
     * is kept because both consumers depend on it.
     */
    convert(sourcePath: string): Promise<ConversionResult>;
}
export interface ConversionResult {
    /** The generated Markdown, ready to write to a `.md` file. */
    markdown: string;
    /**
     * Binary assets (usually images) extracted from the source. The extension
     * writes them next to the output `.md` and rewrites references as needed.
     * `relativePath` is relative to the output file.
     */
    assets?: Asset[];
    /**
     * Non-fatal notes surfaced during conversion — unhandled features, lossy
     * fallbacks, etc. Shown to the user in a diagnostics pane.
     */
    warnings?: string[];
}
export interface Asset {
    relativePath: string;
    content: Buffer;
}
/** Thrown by Converter implementations for any conversion failure. */
export declare class ConversionError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
