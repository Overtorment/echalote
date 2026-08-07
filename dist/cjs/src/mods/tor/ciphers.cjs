'use strict';

var cadenas = require('@hazae41/cadenas');

exports.TorCiphers = void 0;
(function (TorCiphers) {
    TorCiphers.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0xc00a, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0xc014, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_DHE_RSA_WITH_AES_256_CBC_SHA = cadenas.Ciphers.TLS_DHE_RSA_WITH_AES_256_CBC_SHA;
    TorCiphers.TLS_DHE_DSS_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0x0038, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0xc00f, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0xc005, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_RSA_WITH_AES_256_CBC_SHA = new cadenas.Cipher(0x0035, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA = new cadenas.Cipher(0xc007, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0xc009, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_RC4_128_SHA = new cadenas.Cipher(0xc011, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0xc013, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_DHE_RSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0x0033, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_DHE_DSS_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0x0032, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_RC4_128_SHA = new cadenas.Cipher(0xc00c, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0xc00e, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_RC4_128_SHA = new cadenas.Cipher(0xc002, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0xc004, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_RSA_WITH_RC4_128_MD5 = new cadenas.Cipher(0x0004, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_RSA_WITH_RC4_128_SHA = new cadenas.Cipher(0x0005, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_RSA_WITH_AES_128_CBC_SHA = new cadenas.Cipher(0x002f, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0xc008, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0xc012, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0x0016, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0x0013, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0xc00d, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0xc003, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.SSL_RSA_FIPS_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0xfeff, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
    TorCiphers.TLS_RSA_WITH_3DES_EDE_CBC_SHA = new cadenas.Cipher(0x000a, cadenas.DHE_RSA, cadenas.AES_256_CBC, cadenas.SHA);
})(exports.TorCiphers || (exports.TorCiphers = {}));
//# sourceMappingURL=ciphers.cjs.map
