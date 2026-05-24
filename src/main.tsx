import React from 'react'
import ReactDOM from 'react-dom/client'
import { clarity } from 'react-microsoft-clarity'
import App from './App.tsx'
import './index.css'

const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined

if (import.meta.env.PROD && clarityProjectId) {
  clarity.init(clarityProjectId)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
