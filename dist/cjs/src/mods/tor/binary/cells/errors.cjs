'use strict';

var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
class InvalidCellError extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Invalid cell`);
    }
}
_a = InvalidCellError;
class InvalidCommandError extends Error {
    #class = _b;
    name = this.#class.name;
    constructor() {
        super(`Invalid command`);
    }
}
_b = InvalidCommandError;
class UnknownCircuitError extends Error {
    #class = _c;
    name = this.#class.name;
    constructor() {
        super(`Unknown circuit`);
    }
}
_c = UnknownCircuitError;
class ExpectedCircuitError extends Error {
    #class = _d;
    name = this.#class.name;
    constructor() {
        super(`Expected a circuit`);
    }
}
_d = ExpectedCircuitError;
class UnexpectedCircuitError extends Error {
    #class = _e;
    name = this.#class.name;
    constructor() {
        super(`Unexpected a circuit`);
    }
}
_e = UnexpectedCircuitError;
class InvalidRelayCommandError extends Error {
    #class = _f;
    name = this.#class.name;
    constructor() {
        super(`Invalid relay command`);
    }
}
_f = InvalidRelayCommandError;
class UnknownStreamError extends Error {
    #class = _g;
    name = this.#class.name;
    constructor() {
        super(`Unknown stream`);
    }
}
_g = UnknownStreamError;
class ExpectedStreamError extends Error {
    #class = _h;
    name = this.#class.name;
    constructor() {
        super(`Expected a stream`);
    }
}
_h = ExpectedStreamError;
class UnexpectedStreamError extends Error {
    #class = _j;
    name = this.#class.name;
    constructor() {
        super(`Unexpected a stream`);
    }
}
_j = UnexpectedStreamError;
class InvalidRelayCellDigestError extends Error {
    #class = _k;
    name = this.#class.name;
    constructor() {
        super(`Invalid RELAY cell digest`);
    }
}
_k = InvalidRelayCellDigestError;
class InvalidRelaySendmeCellDigestError extends Error {
    #class = _l;
    name = this.#class.name;
    constructor() {
        super(`Invalid RELAY_SENDME cell digest`);
    }
}
_l = InvalidRelaySendmeCellDigestError;
class UnrecognisedRelayCellError extends Error {
    #class = _m;
    name = this.#class.name;
    constructor() {
        super(`Unrecognised relay cell`);
    }
}
_m = UnrecognisedRelayCellError;

exports.ExpectedCircuitError = ExpectedCircuitError;
exports.ExpectedStreamError = ExpectedStreamError;
exports.InvalidCellError = InvalidCellError;
exports.InvalidCommandError = InvalidCommandError;
exports.InvalidRelayCellDigestError = InvalidRelayCellDigestError;
exports.InvalidRelayCommandError = InvalidRelayCommandError;
exports.InvalidRelaySendmeCellDigestError = InvalidRelaySendmeCellDigestError;
exports.UnexpectedCircuitError = UnexpectedCircuitError;
exports.UnexpectedStreamError = UnexpectedStreamError;
exports.UnknownCircuitError = UnknownCircuitError;
exports.UnknownStreamError = UnknownStreamError;
exports.UnrecognisedRelayCellError = UnrecognisedRelayCellError;
//# sourceMappingURL=errors.cjs.map
