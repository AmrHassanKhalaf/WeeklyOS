// ─── createAsyncSlice ──────────────────────────────────────────────────────────
// A typed factory that produces a reusable async-state slice for Zustand stores.
// Eliminates the duplicated isLoading/error boilerplate across feature stores.
//
// Usage:
//   const slice = createAsyncSlice<MyState>(set)
//   // In a store action:
//   await slice.withAsync(async () => { /* your logic */ })

export interface AsyncSlice {
  isLoading: boolean
  error: string | null
  setLoading: (v: boolean) => void
  setError: (msg: string | null) => void
  /** Wraps an async function with automatic loading/error lifecycle management. */
  withAsync: <T>(fn: () => Promise<T>) => Promise<T | undefined>
}

type SetState<S> = (
  partial: S | Partial<S> | ((state: S) => S | Partial<S>),
  replace?: boolean | undefined
) => void

/**
 * Creates a typed async-state slice to be spread into a Zustand store.
 *
 * @param set  The Zustand `set` function from the store creator.
 * @returns    An object with `isLoading`, `error`, `setLoading`, `setError`, and `withAsync`.
 *
 * @example
 * export const useMyStore = create<MyStore>((set) => ({
 *   ...createAsyncSlice(set),
 *   myData: [],
 *   loadMyData: async () => {
 *     const slice = createAsyncSlice(set)
 *     await slice.withAsync(async () => {
 *       const data = await fetchSomething()
 *       set({ myData: data })
 *     })
 *   },
 * }))
 */
export function createAsyncSlice<S extends AsyncSlice>(set: SetState<S>): AsyncSlice {
  return {
    isLoading: false,
    error: null,

    setLoading: (v: boolean) => set({ isLoading: v } as Partial<S>),

    setError: (msg: string | null) => set({ error: msg } as Partial<S>),

    withAsync: async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      set({ isLoading: true, error: null } as Partial<S>)
      try {
        const result = await fn()
        set({ isLoading: false } as Partial<S>)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        set({ isLoading: false, error: message } as Partial<S>)
        console.error('[createAsyncSlice] Operation failed:', message)
        return undefined
      }
    },
  }
}
