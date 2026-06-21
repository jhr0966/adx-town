// 방(room) ID 유틸 — 생성 / 링크·코드 파싱 / URL 동기화
// 방 ID는 Supabase 채널명(`office:<id>`)과 URL ?room= 에 그대로 쓰이므로 ASCII로 제한한다.
// 사람이 지은 이름(한글 등)은 URL ?n= 으로 함께 실어 로비 목록에서 일관되게 보이게 한다.

export function getRoomFromUrl() {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const id = q.get('room')
  if (!id) return null
  return { id: id.trim(), name: (q.get('n') || '').trim() || null }
}

// 이름(선택)을 슬러그로 + 랜덤 6자 → 충돌 없는 고유 방 ID
export function newRoomId(name) {
  const rand = Math.random().toString(36).slice(2, 8)
  const base = (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // 한글·기호는 제거(채널/URL 안전)
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
  return base ? `${base}-${rand}` : `town-${rand}`
}

// 입력값(전체 링크 / "?room=xxx" / 순수 코드)에서 방 ID 추출
export function parseRoomInput(input) {
  const s = (input || '').trim()
  if (!s) return null
  try {
    const r = new URL(s).searchParams.get('room') // 전체 URL인 경우
    if (r) return r.trim()
  } catch { /* URL 아님 → 계속 */ }
  const m = s.match(/room=([^&\s]+)/i) // "room=xxx" 조각
  if (m) return decodeURIComponent(m[1]).trim()
  return s.replace(/\s+/g, '') // 순수 코드
}

// 공유용 절대 URL (이름이 있으면 ?n= 으로 함께)
export function roomUrl(roomId, name) {
  if (typeof window === 'undefined') return ''
  const u = new URL(window.location.href)
  u.search = ''
  u.searchParams.set('room', roomId)
  if (name && name !== roomId) u.searchParams.set('n', name)
  u.hash = ''
  return u.toString()
}

// 현재 주소창에 ?room=(&n=) 반영(새 히스토리 추가 없이) → 링크 공유 가능
export function syncUrl(roomId, name) {
  if (typeof window === 'undefined') return
  try { window.history.replaceState(null, '', roomUrl(roomId, name)) } catch { /* noop */ }
}
