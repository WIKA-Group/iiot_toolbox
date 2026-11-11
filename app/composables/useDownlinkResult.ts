import type { InjectionKey, ShallowRef } from 'vue'

export interface DownlinkResult {

  frames?: string[]

  fPort?: number

  errors?: string[]

  /** Neutral explanation shown while the inputs cannot be encoded yet. */
  hint?: string
}

const DOWNLINK_RESULT: InjectionKey<(result: DownlinkResult) => void> = Symbol('downlink-result')

export function provideDownlinkResult(): {
  result: ShallowRef<DownlinkResult>
  publish: (next: DownlinkResult) => void
} {
  const result = shallowRef<DownlinkResult>({})
  const publish = (next: DownlinkResult) => {
    result.value = next
  }
  provide(DOWNLINK_RESULT, publish)
  return { result, publish }
}

export function useDownlinkResult(): (result: DownlinkResult) => void {
  return inject(DOWNLINK_RESULT, () => {})
}
