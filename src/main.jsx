import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { getTheme, applyTheme } from './lib/theme'
import './index.css'

// 첫 페인트 전에 테마 적용(깜빡임 방지)
applyTheme(getTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
