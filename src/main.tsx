import React from 'react'
import ReactDOM from 'react-dom/client'
import { clarity } from 'react-microsoft-clarity'
import App from './App.tsx'
import './index.css'

const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean
  }
}

function shouldLoadClarity() {
  if (!import.meta.env.PROD || !clarityProjectId) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.matchMedia('(max-width: 1535px)').matches) return false
  return !(navigator as NavigatorWithConnection).connection?.saveData
}

if (shouldLoadClarity() && clarityProjectId) {
  const projectId = clarityProjectId
  const initClarity = () => clarity.init(projectId)
  if (window.requestIdleCallback) {
    window.requestIdleCallback(initClarity, { timeout: 5000 })
  } else {
    window.setTimeout(initClarity, 3500)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
