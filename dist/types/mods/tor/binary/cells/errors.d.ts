import { UnknownAddressType } from './relayed/relay_connected/cell.js';

type CellError = InvalidCellError | InvalidCommandError | UnknownCircuitError | ExpectedCircuitError | UnexpectedCircuitError;
declare class InvalidCellError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidCommandError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnknownCircuitError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class ExpectedCircuitError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnexpectedCircuitError extends Error {
    #private;
    readonly name: string;
    constructor();
}
type RelayCellError = InvalidRelayCommandError | UnknownStreamError | ExpectedStreamError | UnexpectedStreamError | InvalidRelayCellDigestError | UnrecognisedRelayCellError | UnknownAddressType | InvalidRelaySendmeCellDigestError;
declare class InvalidRelayCommandError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnknownStreamError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class ExpectedStreamError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnexpectedStreamError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidRelayCellDigestError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class InvalidRelaySendmeCellDigestError extends Error {
    #private;
    readonly name: string;
    constructor();
}
declare class UnrecognisedRelayCellError extends Error {
    #private;
    readonly name: string;
    constructor();
}

export { ExpectedCircuitError, ExpectedStreamError, InvalidCellError, InvalidCommandError, InvalidRelayCellDigestError, InvalidRelayCommandError, InvalidRelaySendmeCellDigestError, UnexpectedCircuitError, UnexpectedStreamError, UnknownCircuitError, UnknownStreamError, UnrecognisedRelayCellError };
export type { CellError, RelayCellError };
