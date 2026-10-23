import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { getTheme, applyTheme } from './lib/theme'
import './index.css'

// 첫 페인트 전에 테마 적용(깜빡임 방지)
applyTheme(getTheme())

// TEAM 스토어 브릿지는 앱이 storage 이벤트를 듣지 않으면 다른 팀원의 변경 때 화면을 통째로 새로고침한다.
// 이 앱의 공유 데이터는 실시간 채널로 오가므로(localStorage 미사용) 리스너만 등록해 새로고침을 막는다.
window.addEventListener('storage', () => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
