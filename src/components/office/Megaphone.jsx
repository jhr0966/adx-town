import { useState } from 'react'

// 확성기 입력 — 전체에게 보낼 공지 메시지
export function Megaphone({ onSend, onClose }) {
  const [text, setText] = useState('')
  return (
    <div className="mega-pop">
      <span className="mega-icon">📣</span>
      <input
        autoFocus
        maxLength={120}
        placeholder="전체에게 보낼 공지…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend(text)
          if (e.key === 'Escape') onClose()
        }}
      />
      <button onClick={() => onSend(text)}>보내기</button>
    </div>
  )
}
