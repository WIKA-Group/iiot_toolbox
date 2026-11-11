import type { DownlinkResult } from '~/composables/useDownlinkResult'

type Encoder = (input: never) => unknown

type SingleResult = { fPort: number, bytes: number[] } | { errors: string[] }
type MultipleResult = { fPort: number, frames: number[][] } | { errors: string[] }

const MULTIPLE_UNSUPPORTED = 'does not support multiple encoding'

export function toHex(bytes: readonly number[]): string {
  return `0x${bytes.map(n => n.toString(16).padStart(2, '0')).join('')}`
}

/** Uses the multi-frame encoder when the parser offers it, so configurations larger than one frame still encode. */
export function encodeFrames(
  encodeDownlink: Encoder,
  encodeMultipleDownlinks: Encoder | undefined,
  request: { protocol: 'TULIP2' | 'TULIP3', input: unknown },
): DownlinkResult {
  if (encodeMultipleDownlinks) {
    const many = encodeMultipleDownlinks(request as never) as MultipleResult
    if (!('errors' in many)) return { frames: many.frames.map(toHex), fPort: many.fPort }
    if (!many.errors.some(error => error.includes(MULTIPLE_UNSUPPORTED))) return { errors: many.errors }
  }

  const one = encodeDownlink(request as never) as SingleResult
  return 'errors' in one ? { errors: one.errors } : { frames: [toHex(one.bytes)], fPort: one.fPort }
}
