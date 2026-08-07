import { Cipher } from '@hazae41/cadenas';

declare namespace TorCiphers {
    const TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_DHE_RSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_DHE_DSS_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_ECDH_RSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_RSA_WITH_AES_256_CBC_SHA: Cipher;
    const TLS_ECDHE_ECDSA_WITH_RC4_128_SHA: Cipher;
    const TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_ECDHE_RSA_WITH_RC4_128_SHA: Cipher;
    const TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_DHE_RSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_DHE_DSS_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_ECDH_RSA_WITH_RC4_128_SHA: Cipher;
    const TLS_ECDH_RSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_ECDH_ECDSA_WITH_RC4_128_SHA: Cipher;
    const TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_RSA_WITH_RC4_128_MD5: Cipher;
    const TLS_RSA_WITH_RC4_128_SHA: Cipher;
    const TLS_RSA_WITH_AES_128_CBC_SHA: Cipher;
    const TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA: Cipher;
    const SSL_RSA_FIPS_WITH_3DES_EDE_CBC_SHA: Cipher;
    const TLS_RSA_WITH_3DES_EDE_CBC_SHA: Cipher;
}

export { TorCiphers };
