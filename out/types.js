"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionError = void 0;
/** Thrown by Converter implementations for any conversion failure. */
class ConversionError extends Error {
    cause;
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = "ConversionError";
    }
}
exports.ConversionError = ConversionError;
//# sourceMappingURL=types.js.map