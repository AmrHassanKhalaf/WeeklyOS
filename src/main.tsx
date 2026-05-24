import React from 'react'
import ReactDOM from 'react-dom/client'
import { clarity } from 'react-microsoft-clarity'
import App from './App.tsx'
import './index.css'

// Initialize Microsoft Clarity for analytics
clarity.init('wrqbfro5dx')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
