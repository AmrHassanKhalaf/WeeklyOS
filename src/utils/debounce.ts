// ─── debounce.ts ──────────────────────────────────────────────────────────────
// Lightweight typed debounce utility — avoids importing from date-fns
// which does not export a debounce function in v4.

/**
 * Returns a debounced version of `fn` that delays calling it until
 * `waitMs` milliseconds have elapsed since the last call.
 *
 * The returned function is typed to match the original.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: Args): void => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, waitMs)
  }
}

/**
 * Returns a debounced async version of `fn`.
 * Only the *last* call within `waitMs` will be executed.
 */
export function debounceAsync<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  waitMs: number
): (...args: Args) => Promise<R | undefined> {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: Args): Promise<R | undefined> => {
    return new Promise((resolve) => {
      if (timer !== null) clearTimeout(timer)
      timer = setTimeout(async () => {
        timer = null
        resolve(await fn(...args))
      }, waitMs)
    })
  }
}
