import type { DownlinkResult } from '~/composables/useDownlinkResult'

/** Encodes immediately on the first change and throttles rapid follow-ups such as typing; `undefined` keeps the current result. */
export function useLiveEncode(
  build: () => DownlinkResult | undefined,
  publish: (next: DownlinkResult) => void,
  interval = 200,
): void {
  const mounted = useMounted()
  let disposed = false
  onScopeDispose(() => {
    disposed = true
  })

  watchThrottled(
    () => (mounted.value ? build() : undefined),
    (next) => {
      if (next && !disposed) publish(next)
    },
    { throttle: interval, leading: true, trailing: true, immediate: true },
  )
}
