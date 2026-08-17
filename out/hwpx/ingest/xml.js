"use strict";
/// <reference lib="dom" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseXml = parseXml;
exports.findAll = findAll;
const xmldom_1 = require("@xmldom/xmldom");
const xpath = __importStar(require("xpath"));
const namespaces_1 = require("./namespaces");
const select = xpath.useNamespaces(namespaces_1.NAMESPACES);
/**
 * Parse an HWPX section XML buffer. Throws on malformed XML.
 */
function parseXml(buffer) {
    return new xmldom_1.DOMParser().parseFromString(buffer.toString("utf8"), "application/xml");
}
/**
 * Evaluate a namespace-aware XPath expression against a document or element.
 * Returns only Element nodes (attribute/text matches are filtered out).
 */
function findAll(context, expr) {
    const nodes = select(expr, context, false);
    return nodes.filter((n) => n.nodeType === 1 /* ELEMENT_NODE */);
}
//# sourceMappingURL=xml.js.map