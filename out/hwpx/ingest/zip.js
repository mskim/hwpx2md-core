"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openHwpx = openHwpx;
const fs = __importStar(require("node:fs/promises"));
const jszip_1 = __importDefault(require("jszip"));
/**
 * Reads the HWPX (zip) file at `sourcePath` and returns a map from entry
 * name to its raw Buffer contents. Directories are skipped.
 *
 * HWPX files are small (<10 MB typical) so we read the whole archive into
 * memory; no streaming.
 */
async function openHwpx(sourcePath) {
    const buffer = await fs.readFile(sourcePath);
    const zip = await jszip_1.default.loadAsync(buffer);
    const out = new Map();
    for (const [name, entry] of Object.entries(zip.files)) {
        if (entry.dir)
            continue;
        out.set(name, Buffer.from(await entry.async("nodebuffer")));
    }
    return out;
}
//# sourceMappingURL=zip.js.map