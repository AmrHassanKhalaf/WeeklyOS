import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Sidebar visibility modes:
 *   - expanded : full 16rem sidebar with labels
 *   - rail     : collapsed 5rem icon-only rail (desktop/tablet only)
 *   - hidden   : completely hidden (used on mobile or when user closes it)
 */
export type SidebarMode = 'expanded' | 'rail' | 'hidden'

export type FocusModeLevel = 'minimal' | 'deep' // "minimal" is kept only to clean old persisted state.

interface LayoutState {
  /** Primary source of truth for desktop/tablet sidebar */
  sidebarMode: SidebarMode

  /** @deprecated Derived from sidebarMode. Kept for back-compat with TopNav / AppLayout. */
  isLeftSidebarOpen: boolean

  isRightSidebarOpen: boolean
  isMobile: boolean
  
  // ── Focus Mode ──────────────────────────────────────────────────────────────
  isFocusMode: boolean
  focusLevel: FocusModeLevel
  /** Transient: modal/popup overlay that should hide mobile chrome */
  isTaskPickerOpen: boolean
  /** User preference: automatically enter Focus Mode when a pomodoro session starts */
  autoEnterFocusOnStart: boolean

  /** Actions */
  toggleLeftSidebar: () => void
  /** Cycle between expanded → rail → hidden (desktop only) */
  cycleSidebarMode: () => void
  setSidebarMode: (mode: SidebarMode) => void

  openAIWorkspace: () => void
  closeAIWorkspace: () => void
  toggleAIWorkspace: () => void
  /** @deprecated Use toggleAIWorkspace. Kept for older callers. */
  toggleRightSidebar: () => void
  setFocusMode: (isActive: boolean, level?: FocusModeLevel) => void
  setTaskPickerOpen: (isOpen: boolean) => void
  setAutoEnterFocus: (value: boolean) => void
  resetTransientLayout: () => void
  setMobile: (isMobile: boolean) => void
  closeSidebarsOnMobile: () => void
}

const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false
const initialMode: SidebarMode = initialIsMobile ? 'hidden' : 'expanded'

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      sidebarMode: initialMode,
      isLeftSidebarOpen: initialMode !== 'hidden',
      isRightSidebarOpen: false,
      isMobile: initialIsMobile,
      isFocusMode: false,
      focusLevel: 'deep',
      isTaskPickerOpen: false,
      autoEnterFocusOnStart: false,

      toggleLeftSidebar: () =>
        set((state) => {
          if (state.isMobile) {
            const open = !state.isLeftSidebarOpen
            return { isLeftSidebarOpen: open, sidebarMode: open ? 'expanded' : 'hidden' }
          }
          if (state.sidebarMode === 'hidden') {
            return { sidebarMode: 'expanded', isLeftSidebarOpen: true }
          }
          const next: SidebarMode = state.sidebarMode === 'expanded' ? 'rail' : 'expanded'
          return { sidebarMode: next, isLeftSidebarOpen: true }
        }),

      cycleSidebarMode: () =>
        set((state) => {
          if (state.isMobile) return state
          const next: SidebarMode =
            state.sidebarMode === 'expanded'
              ? 'rail'
              : state.sidebarMode === 'rail'
                ? 'hidden'
                : 'expanded'
          return { sidebarMode: next, isLeftSidebarOpen: next !== 'hidden' }
        }),

      setSidebarMode: (mode) =>
        set(() => ({ sidebarMode: mode, isLeftSidebarOpen: mode !== 'hidden' })),

      openAIWorkspace: () =>
        set((state) => ({
          isRightSidebarOpen: true,
          ...(state.isMobile ? { isLeftSidebarOpen: false, sidebarMode: 'hidden' as SidebarMode } : {}),
        })),

      closeAIWorkspace: () => set({ isRightSidebarOpen: false }),

      toggleAIWorkspace: () =>
        set((state) => {
          const isOpening = !state.isRightSidebarOpen
          return {
            isRightSidebarOpen: isOpening,
            ...(isOpening && state.isMobile
              ? { isLeftSidebarOpen: false, sidebarMode: 'hidden' as SidebarMode }
              : {}),
          }
        }),

      toggleRightSidebar: () => get().toggleAIWorkspace(),
      
      setFocusMode: (isActive, level) => set((state) => ({
        isFocusMode: isActive,
        focusLevel: level !== undefined ? level : state.focusLevel,
      })),
      setTaskPickerOpen: (isOpen) => set({ isTaskPickerOpen: isOpen }),

      setAutoEnterFocus: (value) => set({ autoEnterFocusOnStart: value }),

      resetTransientLayout: () =>
        set((state) => ({
          isFocusMode: false,
          isRightSidebarOpen: false,
          isTaskPickerOpen: false,
          ...(state.isMobile
            ? { sidebarMode: 'hidden' as SidebarMode, isLeftSidebarOpen: false }
            : state.sidebarMode === 'hidden'
              ? { sidebarMode: 'expanded' as SidebarMode, isLeftSidebarOpen: true }
              : { isLeftSidebarOpen: true }),
        })),

      setMobile: (isMobile) =>
        set((state) => {
          if (isMobile === state.isMobile) return state
          if (isMobile && !state.isMobile) {
            return {
              isMobile,
              sidebarMode: 'hidden',
              isLeftSidebarOpen: false,
              isRightSidebarOpen: false,
            }
          }
          if (!isMobile && state.isMobile) {
            return {
              isMobile,
              sidebarMode: 'expanded',
              isLeftSidebarOpen: true,
              isRightSidebarOpen: false,
            }
          }
          return state
        }),

      closeSidebarsOnMobile: () =>
        set((state) => {
          if (state.isMobile) {
            return { isLeftSidebarOpen: false, isRightSidebarOpen: false, sidebarMode: 'hidden' }
          }
          return state
        }),
    }),
    {
      name: 'weeklyos:layout',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<LayoutState>
        const safePersisted = { ...persisted }
        delete safePersisted.isFocusMode
        delete safePersisted.isTaskPickerOpen
        const sidebarMode =
          !initialIsMobile && safePersisted.sidebarMode === 'hidden'
            ? 'rail'
            : safePersisted.sidebarMode ?? currentState.sidebarMode
        return {
          ...currentState,
          ...safePersisted,
          sidebarMode,
          isLeftSidebarOpen: sidebarMode !== 'hidden',
          isFocusMode: false,
          isTaskPickerOpen: false,
          isRightSidebarOpen: false,
        }
      },
      // Only persist user preferences, not transient UI state
      partialize: (state) => ({
        sidebarMode: state.sidebarMode === 'hidden' ? 'rail' : state.sidebarMode,
        focusLevel: state.focusLevel,
        autoEnterFocusOnStart: state.autoEnterFocusOnStart,
      }),
    },
  ),
)
