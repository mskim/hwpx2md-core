/**
 * HWPX XML namespace URIs. These are stable in the HWPX spec and are
 * referenced by xpath queries throughout the ingest layer. Keeping them in
 * one place avoids scattered string literals.
 */
export declare const NAMESPACES: {
    readonly hp: "http://www.hancom.co.kr/hwpml/2011/paragraph";
    readonly hc: "http://www.hancom.co.kr/hwpml/2011/core";
    readonly hs: "http://www.hancom.co.kr/hwpml/2011/section";
    readonly hh: "http://www.hancom.co.kr/hwpml/2011/head";
    readonly ha: "http://www.hancom.co.kr/hwpml/2011/app";
    readonly opf: "http://www.idpf.org/2007/opf/";
};
export type NamespacePrefix = keyof typeof NAMESPACES;
