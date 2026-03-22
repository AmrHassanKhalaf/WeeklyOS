import { create } from 'zustand'

interface LayoutState {
  isLeftSidebarOpen: boolean
  isRightSidebarOpen: boolean
  isMobile: boolean
  isFocusMode: boolean
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  toggleFocusMode: () => void
  setMobile: (isMobile: boolean) => void
  closeSidebarsOnMobile: () => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  isLeftSidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  isRightSidebarOpen: false, 
  isMobile: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  isFocusMode: false,
  
  toggleLeftSidebar: () => set(state => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  toggleRightSidebar: () => set(state => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  toggleFocusMode: () => set(state => ({ isFocusMode: !state.isFocusMode })),
  
  setMobile: (isMobile) => set((state) => {
    if (isMobile && !state.isMobile) {
      // Transitioning to mobile: close both
      return { isMobile, isLeftSidebarOpen: false, isRightSidebarOpen: false }
    }
    if (!isMobile && state.isMobile) {
      // Transitioning to desktop: open left by default
      return { isMobile, isLeftSidebarOpen: true, isRightSidebarOpen: false }
    }
    return { isMobile }
  }),
  
  closeSidebarsOnMobile: () => set(state => {
    if (state.isMobile) {
      return { isLeftSidebarOpen: false, isRightSidebarOpen: false }
    }
    return state
  })
}))
