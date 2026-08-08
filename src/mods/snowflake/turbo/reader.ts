import { Opaque } from "@hazae41/binary"
import { TurboFrame } from "./frame.ts"
import { SecretTurboDuplex } from "./stream.ts"

export class SecretTurboReader {

  constructor(
    readonly parent: SecretTurboDuplex
  ) { }

  async onWrite(chunk: Opaque) {
    const frame = chunk.readIntoOrThrow(TurboFrame)

    if (frame.padding)
      return

    this.parent.input.enqueue(frame.fragment)
  }

}