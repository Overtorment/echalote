var _a, _b, _c;
class Unimplemented extends Error {
    #class = _a;
    name = this.#class.name;
    constructor() {
        super(`Unimplemented`);
    }
}
_a = Unimplemented;
class InvalidTorStateError extends Error {
    #class = _b;
    name = this.#class.name;
    constructor() {
        super(`Invalid Tor state`);
    }
}
_b = InvalidTorStateError;
class InvalidTorVersionError extends Error {
    #class = _c;
    name = this.#class.name;
    constructor() {
        super(`Invalid Tor version`);
    }
}
_c = InvalidTorVersionError;

export { InvalidTorStateError, InvalidTorVersionError, Unimplemented };
//# sourceMappingURL=errors.mjs.map
