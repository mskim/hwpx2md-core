/// <reference lib="dom" />

import { DOMParser } from "@xmldom/xmldom";
import * as xpath from "xpath";

import { NAMESPACES } from "./namespaces";

const select = xpath.useNamespaces(NAMESPACES);

/**
 * Parse an HWPX section XML buffer. Throws on malformed XML.
 */
export function parseXml(buffer: Buffer): Document {
  return new DOMParser().parseFromString(buffer.toString("utf8"), "application/xml") as unknown as Document;
}

/**
 * Evaluate a namespace-aware XPath expression against a document or element.
 * Returns only Element nodes (attribute/text matches are filtered out).
 */
export function findAll(context: Document | Element, expr: string): Element[] {
  const nodes = select(expr, context as unknown as Node, false) as Node[];
  return nodes.filter((n): n is Element => n.nodeType === 1 /* ELEMENT_NODE */);
}
