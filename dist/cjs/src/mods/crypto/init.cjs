'use strict';

var ed25519 = require('@hazae41/ed25519');
var sha1 = require('@hazae41/sha1');
var x25519 = require('@hazae41/x25519');
var nobleEd = require('@noble/curves/ed25519');
var sha1$1 = require('@noble/hashes/sha1');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var nobleEd__namespace = /*#__PURE__*/_interopNamespaceDefault(nobleEd);

let ready = null;
/**
 * Install crypto adapters required by TorClientDuplex / circuit ntor.
 * Uses Bun WebCrypto for Ed25519 and Noble for X25519 + SHA-1
 * (Bun's native X25519 rejects valid ntor public keys).
 */
function initBundledCrypto() {
    if (!ready) {
        ready = (async () => {
            if (!ed25519.Ed25519.get().isSome()) {
                ed25519.Ed25519.set(await ed25519.Ed25519.fromNative());
            }
            if (!x25519.X25519.get().isSome()) {
                x25519.X25519.set(x25519.X25519.fromNoble(nobleEd__namespace));
            }
            if (!sha1.Sha1.get().isSome()) {
                sha1.Sha1.set(sha1.Sha1.fromNoble({ sha1: sha1$1.sha1 }));
            }
        })();
    }
    return ready;
}

exports.initBundledCrypto = initBundledCrypto;
//# sourceMappingURL=init.cjs.map
