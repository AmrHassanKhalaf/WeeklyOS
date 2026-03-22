import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { AIAssistant } from './AIAssistant'

interface AppLayoutProps {
  children: ReactNode
  aiVariant?: 'default' | 'evaluation'
}

export function AppLayout({ children, aiVariant = 'default' }: AppLayoutProps) {
  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-hidden">
      <Sidebar />
      <TopNav />
      <AIAssistant variant={aiVariant} />
      <main className="ml-64 mr-80 pt-14 h-screen overflow-y-auto custom-scrollbar bg-surface">
        {children}
      </main>
    </div>
  )
}
