import { useEffect, useState } from 'react'
import { HAS_SUPABASE } from '../lib/config'
import { newRoomId, parseRoomInput } from '../lib/room'
import { createLobby, prettyRoomName } from '../lib/realtime'

// 방 만들기 / 기존 방 리스트에서 선택 / 코드·링크로 입장
export default function RoomLobby({ onPick, onBack }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  // 활성 방 목록 구독 (모두 나가면 1분 뒤 자동으로 사라짐)
  useEffect(() => {
    const lobby = createLobby()
    lobby.onRooms((list) => { setRooms(list); setLoading(false) })
    const t = setTimeout(() => setLoading(false), 4500) // 비트 한 주기 기다린 뒤 빈 목록 표시
    return () => { clearTimeout(t); lobby.leave() }
  }, [])

  const create = (e) => {
    e.preventDefault()
    const nm = name.trim() || null
    onPick(newRoomId(nm), nm)
  }
  const join = (e) => {
    e.preventDefault()
    const id = parseRoomInput(code)
    if (!id) { setErr('방 코드나 공유 링크를 입력하세요.'); return }
    onPick(id, null)
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1>🏢 ADX 타운</h1>
        <p className="lobby-sub">새 방을 만들거나, 열려 있는 방에 들어가세요.</p>

        {/* 열려 있는 방 리스트 */}
        <div className="lobby-block">
          <h2>🟢 열려 있는 방 {rooms.length > 0 && <span className="room-n">{rooms.length}</span>}</h2>
          <div className="room-list">
            {loading ? (
              <div className="room-empty">방 목록 불러오는 중…</div>
            ) : rooms.length === 0 ? (
              <div className="room-empty">아직 열린 방이 없어요. 새로 만들어 보세요!</div>
            ) : (
              rooms.map((r) => (
                <button key={r.id} type="button" className="room-item" onClick={() => onPick(r.id, r.name)}>
                  <span className="room-name">🚪 {r.name && r.name !== r.id ? r.name : prettyRoomName(r.id)}</span>
                  <span className="room-count">👥 {r.count}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lobby-or"><span>또는</span></div>

        {/* 새 방 만들기 */}
        <form className="lobby-block" onSubmit={create}>
          <h2>✨ 새 방 만들기</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="방 이름 (선택) — 예: 디자인팀"
            maxLength={20}
          />
          <button type="submit" className="lobby-btn primary">방 만들고 입장 →</button>
        </form>

        {/* 코드·링크로 입장 */}
        <form className="lobby-block" onSubmit={join}>
          <h2>🔑 코드·링크로 입장</h2>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setErr('') }}
            placeholder="방 코드 또는 공유 링크 붙여넣기"
          />
          {err && <span className="lobby-err">{err}</span>}
          <button type="submit" className="lobby-btn">입장하기</button>
        </form>

        <div className="lobby-foot">
          <button type="button" className="lobby-back" onClick={onBack}>← 처음으로</button>
          <span className="lobby-mode">
            {HAS_SUPABASE ? '🌐 온라인 모드' : '🧪 로컬 모드 (같은 브라우저 탭끼리)'}
          </span>
        </div>
      </div>
    </div>
  )
}
