import { Guard } from './client.js';

type TorState = TorNoneState | TorVersionedState | TorHandshakingState | TorHandshakedState;
interface TorNoneState {
    readonly type: "none";
}
interface TorVersionedState {
    readonly type: "versioned";
    readonly version: number;
}
interface TorHandshakingState {
    readonly type: "handshaking";
    readonly version: number;
    readonly guard: Guard;
}
interface TorHandshakedState {
    readonly type: "handshaked";
    readonly version: number;
    readonly guard: Guard;
}

export type { TorHandshakedState, TorHandshakingState, TorNoneState, TorState, TorVersionedState };
