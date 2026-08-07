'use strict';

var _a, _b, _c, _d;
exports.RelayExtend2Link = void 0;
(function (RelayExtend2Link) {
    function fromAddressString(address) {
        return address.startsWith("[")
            ? RelayExtend2LinkIPv6.from(address)
            : RelayExtend2LinkIPv4.from(address);
    }
    RelayExtend2Link.fromAddressString = fromAddressString;
})(exports.RelayExtend2Link || (exports.RelayExtend2Link = {}));
class RelayExtend2LinkIPv4 {
    hostname;
    port;
    #class = _a;
    static type = 0;
    constructor(hostname, port) {
        this.hostname = hostname;
        this.port = port;
    }
    static from(host) {
        const { hostname, port } = new URL(`http://${host}`);
        return new _a(hostname, Number(port));
    }
    sizeOrThrow() {
        return 1 + 1 + (4 * 1) + 2;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.#class.type);
        cursor.writeUint8OrThrow(4 + 2);
        const [a, b, c, d] = this.hostname.split(".");
        cursor.writeUint8OrThrow(Number(a));
        cursor.writeUint8OrThrow(Number(b));
        cursor.writeUint8OrThrow(Number(c));
        cursor.writeUint8OrThrow(Number(d));
        cursor.writeUint16OrThrow(this.port);
    }
}
_a = RelayExtend2LinkIPv4;
class RelayExtend2LinkIPv6 {
    hostname;
    port;
    #class = _b;
    static type = 1;
    constructor(hostname, port) {
        this.hostname = hostname;
        this.port = port;
    }
    static from(addrress) {
        const { hostname, port } = new URL(`http://${addrress}`);
        const ip = hostname.slice(1, -1);
        return new _b(ip, Number(port));
    }
    sizeOrThrow() {
        return 1 + 1 + (8 * 2) + 2;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.#class.type);
        cursor.writeUint8OrThrow(16 + 2);
        const [a, b, c, d, e, f, g, h] = this.hostname.split(":");
        cursor.writeUint16OrThrow(Number(`0x${a}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${b}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${c}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${d}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${e}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${f}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${g}`) || 0);
        cursor.writeUint16OrThrow(Number(`0x${h}`) || 0);
        cursor.writeUint16OrThrow(this.port);
    }
}
_b = RelayExtend2LinkIPv6;
class RelayExtend2LinkLegacyID {
    fingerprint;
    #class = _c;
    static type = 2;
    constructor(fingerprint) {
        this.fingerprint = fingerprint;
    }
    sizeOrThrow() {
        return 1 + 1 + this.fingerprint.length;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.#class.type);
        cursor.writeUint8OrThrow(20);
        cursor.writeOrThrow(this.fingerprint);
    }
}
_c = RelayExtend2LinkLegacyID;
class RelayExtend2LinkModernID {
    fingerprint;
    #class = _d;
    static type = 3;
    constructor(fingerprint) {
        this.fingerprint = fingerprint;
    }
    sizeOrThrow() {
        return 1 + 1 + this.fingerprint.length;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.#class.type);
        cursor.writeUint8OrThrow(32);
        cursor.writeOrThrow(this.fingerprint);
    }
}
_d = RelayExtend2LinkModernID;

exports.RelayExtend2LinkIPv4 = RelayExtend2LinkIPv4;
exports.RelayExtend2LinkIPv6 = RelayExtend2LinkIPv6;
exports.RelayExtend2LinkLegacyID = RelayExtend2LinkLegacyID;
exports.RelayExtend2LinkModernID = RelayExtend2LinkModernID;
//# sourceMappingURL=link.cjs.map
