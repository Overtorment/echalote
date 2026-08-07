import { Cipher, DHE_RSA, AES_256_CBC, SHA, Ciphers } from '@hazae41/cadenas';

var TorCiphers;
(function (TorCiphers) {
    TorCiphers.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA = new Cipher(0xc00a, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA = new Cipher(0xc014, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_DHE_RSA_WITH_AES_256_CBC_SHA = Ciphers.TLS_DHE_RSA_WITH_AES_256_CBC_SHA;
    TorCiphers.TLS_DHE_DSS_WITH_AES_256_CBC_SHA = new Cipher(0x0038, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_AES_256_CBC_SHA = new Cipher(0xc00f, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA = new Cipher(0xc005, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_RSA_WITH_AES_256_CBC_SHA = new Cipher(0x0035, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_RC4_128_SHA = new Cipher(0xc007, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA = new Cipher(0xc009, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_RC4_128_SHA = new Cipher(0xc011, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA = new Cipher(0xc013, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_DHE_RSA_WITH_AES_128_CBC_SHA = new Cipher(0x0033, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_DHE_DSS_WITH_AES_128_CBC_SHA = new Cipher(0x0032, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_RC4_128_SHA = new Cipher(0xc00c, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_AES_128_CBC_SHA = new Cipher(0xc00e, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_RC4_128_SHA = new Cipher(0xc002, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA = new Cipher(0xc004, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_RSA_WITH_RC4_128_MD5 = new Cipher(0x0004, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_RSA_WITH_RC4_128_SHA = new Cipher(0x0005, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_RSA_WITH_AES_128_CBC_SHA = new Cipher(0x002f, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0xc008, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0xc012, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0x0016, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA = new Cipher(0x0013, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0xc00d, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0xc003, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.SSL_RSA_FIPS_WITH_3DES_EDE_CBC_SHA = new Cipher(0xfeff, DHE_RSA, AES_256_CBC, SHA);
    TorCiphers.TLS_RSA_WITH_3DES_EDE_CBC_SHA = new Cipher(0x000a, DHE_RSA, AES_256_CBC, SHA);
})(TorCiphers || (TorCiphers = {}));

export { TorCiphers };
//# sourceMappingURL=ciphers.mjs.map
