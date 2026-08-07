'use strict';

var _a;
class Target {
    relayid_rsa;
    circuit;
    forward_digest;
    backward_digest;
    forward_key;
    backward_key;
    #class = _a;
    delivery = 1000;
    package = 1000;
    digests = new Array();
    constructor(relayid_rsa, circuit, forward_digest, backward_digest, forward_key, backward_key) {
        this.relayid_rsa = relayid_rsa;
        this.circuit = circuit;
        this.forward_digest = forward_digest;
        this.backward_digest = backward_digest;
        this.forward_key = forward_key;
        this.backward_key = backward_key;
    }
    [Symbol.dispose]() {
        this.forward_digest[Symbol.dispose]();
        this.backward_digest[Symbol.dispose]();
    }
}
_a = Target;

exports.Target = Target;
//# sourceMappingURL=target.cjs.map
