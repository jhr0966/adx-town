import { useState } from 'react'
import { AVATARS, COLORS } from '../constants'
import { HAS_SUPABASE } from '../lib/config'
import { prettyRoomName } from '../lib/realtime'

// 지난번 닉네임/아바타 기억 (localStorage)
const PREFS_KEY = 'adxtown:prefs'
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {} } catch { return {} }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export default function EntryScreen({ onEnter, roomId, roomName, onBack }) {
  const saved = loadPrefs()
  const [nickname, setNickname] = useState(saved.nickname || '')
  // 저장된 값이 있으면 복원, 없으면(첫 접속) 랜덤으로 기본 선택
  const [avatar, setAvatar] = useState(() =>
    saved.avatar && AVATARS.includes(saved.avatar) ? saved.avatar : pick(AVATARS),
  )
  const [color, setColor] = useState(() =>
    saved.color && COLORS.includes(saved.color) ? saved.color : pick(COLORS),
  )

  const submit = (e) => {
    e.preventDefault()
    const name = nickname.trim()
    if (!name) return
    const nick = name.slice(0, 16)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ nickname: nick, avatar, color })) } catch {}
    onEnter({
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2),
      nickname: nick,
      avatar,
      color,
    })
  }

  return (
    <div className="entry">
      <form className="entry-card" onSubmit={submit}>
        <h1>🏢 ADX 타운 입장</h1>
        {roomId && <div className="entry-room">방: <b>{roomName || prettyRoomName(roomId)}</b></div>}

        <label className="field">
          <span>닉네임</span>
          <input
            autoFocus
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="이름을 입력하세요"
            maxLength={16}
          />
        </label>

        <div className="field">
          <span>아바타</span>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                className={'avatar-pick' + (a === avatar ? ' selected' : '')}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>색상</span>
          <div className="color-row">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={'color-pick' + (c === color ? ' selected' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="enter-btn" disabled={!nickname.trim()}>
          입장하기
        </button>

        {onBack && (
          <button type="button" className="entry-back" onClick={onBack}>← 다른 방 선택</button>
        )}

        <p className="mode-note">
          {HAS_SUPABASE
            ? '🌐 온라인 모드 — 다른 사람들과 실시간 연결됩니다.'
            : '🧪 로컬 모드 — Supabase 미설정. 같은 브라우저의 다른 탭을 열어 테스트하세요.'}
        </p>
      </form>
    </div>
  )
}
