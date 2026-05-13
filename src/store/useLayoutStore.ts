import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Sidebar visibility modes:
 *   - expanded : full 16rem sidebar with labels
 *   - rail     : collapsed 5rem icon-only rail (desktop/tablet only)
 *   - hidden   : completely hidden (used on mobile or when user closes it)
 */
export type SidebarMode = 'expanded' | 'rail' | 'hidden'

export type FocusModeLevel = 'minimal' | 'deep'

interface LayoutState {
  /** Primary source of truth for desktop/tablet sidebar */
  sidebarMode: SidebarMode

  /** @deprecated Derived from sidebarMode. Kept for back-compat with TopNav / AppLayout. */
  isLeftSidebarOpen: boolean

  isRightSidebarOpen: boolean
  isMobile: boolean
  
  // Focus Mode
  isFocusMode: boolean
  focusLevel: FocusModeLevel

  /** Actions */
  toggleLeftSidebar: () => void
  /** Cycle between expanded → rail → hidden (desktop only) */
  cycleSidebarMode: () => void
  setSidebarMode: (mode: SidebarMode) => void

  toggleRightSidebar: () => void
  toggleFocusMode: () => void
  setFocusMode: (isActive: boolean, level?: FocusModeLevel) => void
  setFocusLevel: (level: FocusModeLevel) => void
  setMobile: (isMobile: boolean) => void
  closeSidebarsOnMobile: () => void
}

const initialIsMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false
const initialMode: SidebarMode = initialIsMobile ? 'hidden' : 'expanded'

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarMode: initialMode,
      isLeftSidebarOpen: initialMode !== 'hidden',
      isRightSidebarOpen: false,
      isMobile: initialIsMobile,
      isFocusMode: false,
      focusLevel: 'minimal',

      toggleLeftSidebar: () =>
        set((state) => {
          if (state.isMobile) {
            // On mobile this is a drawer: toggle visible / hidden
            const open = !state.isLeftSidebarOpen
            return { isLeftSidebarOpen: open, sidebarMode: open ? 'expanded' : 'hidden' }
          }
          // Desktop: toggle between hidden and last non-hidden mode (default expanded)
          if (state.sidebarMode === 'hidden') {
            return { sidebarMode: 'expanded', isLeftSidebarOpen: true }
          }
          return { sidebarMode: 'hidden', isLeftSidebarOpen: false }
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

      toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
      
      toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
      
      setFocusMode: (isActive, level) => set((state) => ({
        isFocusMode: isActive,
        focusLevel: level !== undefined ? level : state.focusLevel
      })),

      setFocusLevel: (level) => set({ focusLevel: level }),

      setMobile: (isMobile) =>
        set((state) => {
          if (isMobile && !state.isMobile) {
            // Entering mobile: hide desktop sidebars
            return {
              isMobile,
              sidebarMode: 'hidden',
              isLeftSidebarOpen: false,
              isRightSidebarOpen: false,
            }
          }
          if (!isMobile && state.isMobile) {
            // Leaving mobile: restore to expanded by default
            return {
              isMobile,
              sidebarMode: 'expanded',
              isLeftSidebarOpen: true,
              isRightSidebarOpen: false,
            }
          }
          return { isMobile }
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
      // Only persist user preferences
      partialize: (state) => ({ 
        sidebarMode: state.sidebarMode,
        focusLevel: state.focusLevel,
        isFocusMode: state.isFocusMode
      }),
    },
  ),
)
