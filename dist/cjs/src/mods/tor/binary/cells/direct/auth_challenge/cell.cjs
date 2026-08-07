'use strict';

var errors = require('../../../../errors.cjs');

var _a;
class AuthChallengeCell {
    challenge;
    methods;
    #class = _a;
    static old = false;
    static circuit = false;
    static command = 130;
    constructor(challenge, methods) {
        this.challenge = challenge;
        this.methods = methods;
    }
    get circuit() {
        return this.#class.circuit;
    }
    get command() {
        return this.#class.command;
    }
    sizeOrThrow() {
        throw new errors.Unimplemented();
    }
    writeOrThrow(cursor) {
        throw new errors.Unimplemented();
    }
    static readOrThrow(cursor) {
        const challenge = cursor.readAndCopyOrThrow(32);
        const nmethods = cursor.readUint16OrThrow();
        const methods = new Array(nmethods);
        for (let i = 0; i < nmethods; i++)
            methods[i] = cursor.readUint16OrThrow();
        return new _a(challenge, methods);
    }
}
_a = AuthChallengeCell;

exports.AuthChallengeCell = AuthChallengeCell;
//# sourceMappingURL=cell.cjs.map
