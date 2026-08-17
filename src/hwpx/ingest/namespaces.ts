/**
 * HWPX XML namespace URIs. These are stable in the HWPX spec and are
 * referenced by xpath queries throughout the ingest layer. Keeping them in
 * one place avoids scattered string literals.
 */
export const NAMESPACES = {
  hp: "http://www.hancom.co.kr/hwpml/2011/paragraph",
  hc: "http://www.hancom.co.kr/hwpml/2011/core",
  hs: "http://www.hancom.co.kr/hwpml/2011/section",
  hh: "http://www.hancom.co.kr/hwpml/2011/head",
  ha: "http://www.hancom.co.kr/hwpml/2011/app",
  opf: "http://www.idpf.org/2007/opf/",
} as const;

export type NamespacePrefix = keyof typeof NAMESPACES;
