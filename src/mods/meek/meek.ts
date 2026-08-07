import { BatchedFetchStream } from "libs/transports/http.js"

/**
 * Tor Browser's CDN77 meek bridge backend.
 * Azure `meek.azureedge.net` was retired and no longer resolves.
 */
export const DEFAULT_MEEK_URL = "https://1603026938.rsc.cdn77.org/"

export async function createMeekStream(url: string = DEFAULT_MEEK_URL) {
  const headers = { "x-session-id": crypto.randomUUID() }
  const request = new Request(url, { headers })

  return new BatchedFetchStream(request)
}
