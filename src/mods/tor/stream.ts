import { Opaque, Writable } from "@hazae41/binary";
import { FullDuplex } from "@hazae41/cascade";
import { Cursor } from "@hazae41/cursor";
import { CloseEvents, ErrorEvents, SuperEventTarget } from "@hazae41/plume";
import { Console } from "../console/index.ts";
import { RelayCell } from "./binary/cells/direct/relay/cell.ts";
import { RelayDataCell } from "./binary/cells/relayed/relay_data/cell.ts";
import { RelayEndCell } from "./binary/cells/relayed/relay_end/cell.ts";
import { SecretCircuit } from "./circuit.ts";
import { RelayConnectedCell } from "./binary/cells/relayed/relay_connected/cell.ts";
import { RelayEndReason, RelayEndReasonOther } from "./binary/cells/relayed/relay_end/reason.ts";
import { RelaySendmeStreamCell } from "./binary/cells/relayed/relay_sendme/cell.ts";

/**
 * Adapt an Opaque/Writable duplex (e.g. Cadenas TLS `outer`) to raw bytes.
 * Owns `opaque`'s streams — do not also pipe the Opaque side elsewhere.
 */
export function asBytesDuplex(
  opaque: ReadableWritablePair<Opaque, Writable>,
): ReadableWritablePair<Uint8Array, Uint8Array> {
  const readable = opaque.readable.pipeThrough(
    new TransformStream<Opaque, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk.bytes)
      },
    }),
  )

  const toOpaque = new TransformStream<Uint8Array, Opaque>({
    transform(chunk, controller) {
      controller.enqueue(new Opaque(chunk))
    },
  })
  void toOpaque.readable.pipeTo(opaque.writable).catch(() => {})

  return { readable, writable: toOpaque.writable }
}

/**
 * Wrap a Uint8Array duplex as hazae41 Opaque/Writable (Cadenas TLS, …).
 */
export function asOpaqueDuplex(
  bytes: ReadableWritablePair<Uint8Array, Uint8Array>,
): ReadableWritablePair<Opaque, Writable> {
  const readable = bytes.readable.pipeThrough(
    new TransformStream<Uint8Array, Opaque>({
      transform(chunk, controller) {
        controller.enqueue(new Opaque(chunk))
      },
    }),
  )

  const fromWritable = new TransformStream<Writable, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(Writable.writeToBytesOrThrow(chunk))
    },
  })
  void fromWritable.readable.pipeTo(bytes.writable).catch(() => {})

  return { readable, writable: fromWritable.writable }
}

export class TorStreamDuplex {

  readonly #secret: SecretTorStreamDuplex
  readonly #outer: ReadableWritablePair<Uint8Array, Uint8Array>

  constructor(secret: SecretTorStreamDuplex) {
    this.#secret = secret
    this.#outer = asBytesDuplex(secret.outer)
  }

  [Symbol.dispose]() {
    this.close()
  }

  get id() {
    return this.#secret.id
  }

  get type() {
    return this.#secret.type
  }

  /** Raw byte duplex (Uint8Array in, Uint8Array out). */
  get outer() {
    return this.#outer
  }

  error(reason?: unknown) {
    this.#secret.error(reason)
  }

  close() {
    this.#secret.close()
  }

}

export class RelayEndedError extends Error {
  readonly #class = RelayEndedError
  readonly name = this.#class.name

  constructor(
    readonly reason: RelayEndReason
  ) {
    super(`Relay ended`, { cause: reason })
  }

}

export type TorStreamEvents =
  & CloseEvents
  & ErrorEvents
  & { connected: () => void }

export type SecretTorStreamDuplexType =
  | "external"
  | "directory"

export class SecretTorStreamDuplex {
  readonly #class = SecretTorStreamDuplex

  readonly duplex: FullDuplex<Opaque, Writable>

  readonly events = new SuperEventTarget<TorStreamEvents>()

  delivery = 500
  package = 500

  #onClean: () => void

  constructor(
    readonly type: SecretTorStreamDuplexType,
    readonly id: number,
    readonly circuit: SecretCircuit
  ) {
    this.duplex = new FullDuplex<Opaque, Writable>({
      output: {
        write: c => this.#onOutputWrite(c),
      },
      error: e => this.#onDuplexError(e),
      close: () => this.#onDuplexClose()
    })

    const onCircuitClose = this.#onCircuitClose.bind(this)
    const onCircuitError = this.#onCircuitError.bind(this)

    const onRelayConnectedCell = this.#onRelayConnectedCell.bind(this)
    const onRelayDataCell = this.#onRelayDataCell.bind(this)
    const onRelayEndCell = this.#onRelayEndCell.bind(this)

    this.circuit.events.on("close", onCircuitClose, { passive: true })
    this.circuit.events.on("error", onCircuitError, { passive: true })

    this.circuit.events.on("RELAY_CONNECTED", onRelayConnectedCell, { passive: true })
    this.circuit.events.on("RELAY_DATA", onRelayDataCell, { passive: true })
    this.circuit.events.on("RELAY_END", onRelayEndCell, { passive: true })

    this.#onClean = () => {
      this.circuit.events.off("close", onCircuitClose)
      this.circuit.events.off("error", onCircuitError)

      this.circuit.events.off("RELAY_CONNECTED", onRelayConnectedCell)
      this.circuit.events.off("RELAY_DATA", onRelayDataCell)
      this.circuit.events.off("RELAY_END", onRelayEndCell)

      this.circuit.streams.delete(this.id)

      this.#onClean = () => { }
    }
  }

  [Symbol.dispose]() {
    this.close()
  }

  get inner() {
    return this.duplex.inner
  }

  get outer() {
    return this.duplex.outer
  }

  get input() {
    return this.duplex.input
  }

  get output() {
    return this.duplex.output
  }

  get closed() {
    return this.duplex.closed
  }

  close() {
    this.duplex.close()
  }

  error(reason?: unknown) {
    this.duplex.error(reason)
  }

  async #onDuplexClose() {
    if (!this.circuit.closed) {
      const relay_end_cell = new RelayEndCell(new RelayEndReasonOther(RelayEndCell.reasons.REASON_DONE))
      const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_end_cell)
      this.circuit.tor.output.enqueue(relay_cell.cellOrThrow())

      this.package--
    }

    await this.events.emit("close")

    this.#onClean()
  }

  async #onDuplexError(reason?: unknown) {
    if (!this.circuit.closed) {
      const relay_end_cell = new RelayEndCell(new RelayEndReasonOther(RelayEndCell.reasons.REASON_MISC))
      const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_end_cell)
      this.circuit.tor.output.enqueue(relay_cell.cellOrThrow())

      this.package--
    }

    await this.events.emit("error", reason)

    this.#onClean()
  }

  async #onCircuitClose() {
    Console.debug(`${this.#class.name}.onCircuitClose`)

    if (this.duplex.closing)
      return

    this.duplex.close()
  }

  async #onCircuitError(reason?: unknown) {
    Console.debug(`${this.#class.name}.onCircuitError`, { reason })

    if (this.duplex.closing)
      return

    this.duplex.error(reason)
  }

  async #onRelayConnectedCell(cell: RelayCell.Streamful<Opaque>) {
    if (cell.stream !== this)
      return

    if (this.type === "directory") {
      await this.events.emit("connected")
      return
    }

    if (this.type === "external") {
      const cell2 = RelayCell.Streamful.intoOrThrow(cell, RelayConnectedCell)

      Console.debug(`${this.#class.name}.onRelayConnectedCell`, cell2)

      await this.events.emit("connected")
      return
    }
  }

  async #onRelayDataCell(cell: RelayCell.Streamful<RelayDataCell<Opaque>>) {
    if (cell.stream !== this)
      return

    Console.debug(`${this.#class.name}.onRelayDataCell`, cell)

    this.delivery--

    if (this.delivery === 450) {
      this.delivery = 500

      const sendme = new RelaySendmeStreamCell()
      const sendme_cell = RelayCell.Streamful.from(this.circuit, this, sendme)
      this.circuit.tor.output.enqueue(sendme_cell.cellOrThrow())
    }

    this.input.enqueue(cell.fragment.fragment)
  }

  async #onRelayEndCell(cell: RelayCell.Streamful<RelayEndCell>) {
    if (cell.stream !== this)
      return

    Console.debug(`${this.#class.name}.onRelayEndCell`, cell)

    if (this.duplex.closing)
      return

    if (cell.fragment.reason.id === RelayEndCell.reasons.REASON_DONE)
      this.duplex.close()
    else
      this.duplex.error(new RelayEndedError(cell.fragment.reason))
  }

  async #onOutputWrite(writable: Writable) {
    if (writable.sizeOrThrow() > RelayCell.DATA_LEN)
      return await this.#onWriteChunked(writable)

    return await this.#onWriteDirect(writable)
  }

  async #onWriteDirect(writable: Writable) {
    const relay_data_cell = new RelayDataCell(writable)
    const relay_cell = RelayCell.Streamful.from(this.circuit, this, relay_data_cell)

    this.circuit.tor.output.enqueue(relay_cell.cellOrThrow())

    this.package--
  }

  async #onWriteChunked(writable: Writable) {
    const bytes = Writable.writeToBytesOrThrow(writable)
    const cursor = new Cursor(bytes)

    for (const chunk of cursor.splitOrThrow(RelayCell.DATA_LEN))
      await this.#onWriteDirect(new Opaque(chunk))

    return
  }

}