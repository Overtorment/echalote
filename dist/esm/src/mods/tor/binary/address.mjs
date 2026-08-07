class TypedAddress {
    type;
    value;
    static types = {
        IPv4: 4,
        IPv6: 6
    };
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
    sizeOrThrow() {
        return 1 + 1 + this.value.length;
    }
    writeOrThrow(cursor) {
        cursor.writeUint8OrThrow(this.type);
        cursor.writeUint8OrThrow(this.value.length);
        cursor.writeOrThrow(this.value);
    }
    static readOrThrow(cursor) {
        const type = cursor.readUint8OrThrow();
        const length = cursor.readUint8OrThrow();
        const value = cursor.readAndCopyOrThrow(length);
        return new TypedAddress(type, value);
    }
}
class Address4 {
    address;
    /**
     * IPv4 address
     * @param address xxx.xxx.xxx.xxx
     */
    constructor(address) {
        this.address = address;
    }
    sizeOrThrow() {
        return 4;
    }
    writeOrThrow(cursor) {
        const parts = this.address.split(".");
        for (let i = 0; i < 4; i++)
            cursor.writeUint8OrThrow(Number(parts[i]));
        return;
    }
    static readOrThrow(cursor) {
        const parts = new Array(4);
        for (let i = 0; i < 4; i++)
            parts[i] = String(cursor.readUint8OrThrow());
        return new Address4(parts.join("."));
    }
}
class Address6 {
    address;
    /**
     * IPv6 address
     * @param address [xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx]
     */
    constructor(address) {
        this.address = address;
    }
    sizeOrThrow() {
        return 16;
    }
    writeOrThrow(cursor) {
        const parts = this.address.slice(1, -1).split(":");
        for (let i = 0; i < 8; i++)
            cursor.writeUint16OrThrow(Number(parts[i]));
        return;
    }
    static readOrThrow(cursor) {
        const parts = new Array(8);
        for (let i = 0; i < 8; i++)
            parts[i] = String(cursor.readUint16OrThrow());
        return new Address6(`[${parts.join(":")}]`);
    }
}

export { Address4, Address6, TypedAddress };
//# sourceMappingURL=address.mjs.map
