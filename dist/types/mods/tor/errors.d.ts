declare class Unimplemented extends Error {
    #private;
    readonly name: string;
    constructor();
}
type TorClientError = InvalidTorStateError | InvalidTorVersionError;
declare class InvalidTorStateError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidTorVersionError extends Error {
    #private;
    readonly name: string;
    constructor();
}

export { InvalidTorStateError, InvalidTorVersionError, Unimplemented };
export type { TorClientError };
