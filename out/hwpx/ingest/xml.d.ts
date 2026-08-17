/**
 * Parse an HWPX section XML buffer. Throws on malformed XML.
 */
export declare function parseXml(buffer: Buffer): Document;
/**
 * Evaluate a namespace-aware XPath expression against a document or element.
 * Returns only Element nodes (attribute/text matches are filtered out).
 */
export declare function findAll(context: Document | Element, expr: string): Element[];
