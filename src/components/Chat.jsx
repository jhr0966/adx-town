import { useEffect, useRef, useState } from 'react'
import { toShareableSrc } from '../lib/image'

export default function Chat({ me, messages, onSend, open = true, minimized = false, onClose, onToggleMin, onEmote }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null) // 확대해서 볼 사진 dataURL
  const listRef = useRef(null)
  const fileRef = useRef(null)
  const inputRef = useRef(null)

  // 새 메시지 오면 자동 스크롤
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // '/' 또는 Enter 로 채팅 입력창 포커스 (입력창·버튼 포커스 중일 땐 제외)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' && e.key !== 'Enter') return
      const el = document.activeElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || el?.isContentEditable) return
      if (e.key === '/') e.preventDefault() // '/' 문자 입력 방지 (Enter는 그대로)
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    onSend({ type: 'text', text: t })
    setText('')
  }

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const src = await toShareableSrc(file, 1024)
    onSend({ type: 'photo', photo: src, text: file.name })
    e.target.value = ''
  }

  return (
    <aside className={'chat' + (open ? ' open' : '') + (minimized ? ' min' : '')}>
      <div className="chat-header">
        <span>💬 채팅</span>
        <span className="chat-header-btns">
          <button className="chat-min" onClick={onToggleMin} aria-label="채팅 최소화">
            {minimized ? '▢' : '—'}
          </button>
          <button className="chat-close" onClick={onClose} aria-label="채팅 닫기">✕</button>
        </span>
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">아직 메시지가 없습니다.</div>
        )}
        {messages.map((m) =>
          m.type === 'system' ? (
            <div key={m.id} className="msg-system">{m.text}</div>
          ) : (
          <div
            key={m.id}
            className={'msg' + (m.from === me.id ? ' mine' : '')}
          >
            <div className="msg-sender">
              {m.avatar} {m.sender}
            </div>
            {m.type === 'photo' ? (
              <img
                className="msg-photo"
                src={m.photo}
                alt={m.text || 'photo'}
                onClick={() => setPreview(m.photo)}
              />
            ) : (
              <div className="msg-text">{m.text}</div>
            )}
          </div>
          ),
        )}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <button
          type="button"
          className="photo-btn"
          title="사진 공유"
          onClick={() => fileRef.current?.click()}
        >
          🖼️
        </button>
        <button
          type="button"
          className="emote-btn"
          title="감정표현"
          onClick={onEmote}
        >
          😄
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={pickPhoto}
        />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.target.blur()
            // 빈 상태로 Enter → 채팅 비활성화(이동 가능). 내용 있으면 전송(form submit).
            // stopPropagation: 전역 '/'·Enter 포커스 핸들러가 다시 포커스하지 않도록.
            if (e.key === 'Enter' && !text.trim()) {
              e.preventDefault()
              e.stopPropagation()
              e.target.blur()
            }
          }}
          placeholder="메시지 입력… ( / 포커스, Esc 해제)"
        />
        <button type="submit">전송</button>
      </form>

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt="확대" />
        </div>
      )}
    </aside>
  )
}
