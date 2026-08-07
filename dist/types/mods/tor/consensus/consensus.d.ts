import { Circuit } from '../circuit.js';

interface Consensus {
    readonly type: string;
    readonly version: number;
    readonly status: string;
    readonly method: number;
    readonly validAfter: Date;
    readonly freshUntil: Date;
    readonly votingDelay: [number, number];
    readonly clientVersions: string[];
    readonly serverVersions: string[];
    readonly knownFlags: string[];
    readonly recommendedClientProtocols: Record<string, string>;
    readonly recommendedRelayProtocols: Record<string, string>;
    readonly requiredClientProtocols: Record<string, string>;
    readonly requiredRelayProtocols: Record<string, string>;
    readonly params: Record<string, string>;
    readonly sharedRandPreviousValue: Consensus.SharedRandom;
    readonly sharedRandCurrentValue: Consensus.SharedRandom;
    readonly authorities: Consensus.Authority[];
    readonly microdescs: Consensus.Microdesc.Head[];
    readonly bandwidthWeights: Record<string, string>;
    readonly preimage: string;
    readonly signatures: Consensus.Signature[];
}
declare namespace Consensus {
    interface SharedRandom {
        readonly reveals: number;
        readonly random: string;
    }
    interface Authority {
        readonly nickname: string;
        readonly identity: string;
        readonly hostname: string;
        readonly ipaddress: string;
        readonly dirport: number;
        readonly orport: number;
        readonly contact: string;
        readonly digest: string;
    }
    namespace Authority {
        const trusteds: Set<string>;
    }
    interface Signature {
        readonly algorithm: string;
        readonly identity: string;
        readonly signingKeyDigest: string;
        readonly signature: string;
    }
    function fetchOrThrow(circuit: Circuit, signal?: AbortSignal): Promise<Consensus>;
    function parseOrThrow(text: string): Consensus;
    function verifyOrThrow(circuit: Circuit, consensus: Consensus, signal?: AbortSignal): Promise<boolean>;
    interface Certificate {
        readonly version: number;
        readonly fingerprint: string;
        readonly published: Date;
        readonly expires: Date;
        readonly identityKey: string;
        readonly signingKey: string;
        readonly crossCert: string;
        readonly preimage: string;
        readonly signature: string;
    }
    namespace Certificate {
        function fetchAllOrThrow(circuit: Circuit, signal?: AbortSignal): Promise<Certificate[]>;
        function fetchOrThrow(circuit: Circuit, fingerprint: string, signal?: AbortSignal): Promise<Certificate>;
        function verifyOrThrow(cert: Certificate): Promise<boolean>;
        function parseOrThrow(text: string): Certificate[];
    }
    type Microdesc = Microdesc.Head & Microdesc.Body;
    namespace Microdesc {
        interface Head {
            readonly nickname: string;
            readonly identity: string;
            readonly date: string;
            readonly hour: string;
            readonly hostname: string;
            readonly orport: number;
            readonly dirport: number;
            readonly ipv6?: string;
            readonly microdesc: string;
            readonly flags: string[];
            readonly version: string;
            readonly entries: Record<string, string>;
            readonly bandwidth: Record<string, string>;
        }
        interface Body {
            readonly onionKey: string;
            readonly ntorOnionKey: string;
            readonly idEd25519: string;
        }
        function fetchOrThrow(circuit: Circuit, ref: Head, signal?: AbortSignal): Promise<Microdesc>;
        function parseOrThrow(text: string): Body[];
    }
}

export { Consensus };
