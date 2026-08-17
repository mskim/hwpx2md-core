/**
 * Reads the HWPX (zip) file at `sourcePath` and returns a map from entry
 * name to its raw Buffer contents. Directories are skipped.
 *
 * HWPX files are small (<10 MB typical) so we read the whole archive into
 * memory; no streaming.
 */
export declare function openHwpx(sourcePath: string): Promise<Map<string, Buffer>>;
