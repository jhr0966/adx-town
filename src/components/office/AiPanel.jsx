import { useEffect, useRef, useState } from 'react'

// AI 비서 대화 패널
export function AiPanel({ messages, busy, onAsk, onClose, exiting, shared, onToggleShare }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t || busy) return
    onAsk(t)
    setText('')
  }

  return (
    <aside className={'ai-panel' + (exiting ? ' ai-exit' : '')}>
      <div className="ai-head">
        <span>🤖 자비스</span>
        <span className="ai-head-btns">
          <button
            className={'ai-share' + (shared ? ' on' : '')}
            onClick={onToggleShare}
            title="다른 사람에게도 내 자비스 보이기"
          >
            {shared ? '👁 공유중' : '🔒 나만'}
          </button>
          <button className="ai-close" onClick={onClose} aria-label="닫기">✕</button>
        </span>
      </div>
      <div className="ai-list" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={'ai-msg ' + m.role}>{m.text}</div>
        ))}
        {busy && <div className="ai-msg assistant ai-typing">생각 중<span>…</span></div>}
      </div>
      <form className="ai-input" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="자비스에게 물어보세요…"
        />
        <button type="submit" disabled={busy}>전송</button>
      </form>
    </aside>
  )
}
