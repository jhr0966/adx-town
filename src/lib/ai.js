import { AI_PROXY, GROQ_BASE, GROQ_KEY, API_KEY_STORAGE } from './config'

const MODEL = 'llama-3.3-70b-versatile'
const SYSTEM =
  '당신의 이름은 "자비스"이며, ADX 타운이라는 가상 오피스에 상주하는 유능하고 친절한 AI 비서입니다. 한국어로 간결하고 정확하게, 도움이 되게 답하세요.'

// history: [{ role: 'user'|'assistant', text }]
// context: 현재 사무실 채팅 이력(문자열) — AI가 참고할 전체 대화 맥락
export async function askGroq(history, context = '') {
  const system =
    SYSTEM +
    (context
      ? `\n\n[현재 사무실 채팅 이력]\n${context}\n\n사용자가 "방금/아까/누가 ~라고 했어" 처럼 물으면 위 채팅 이력을 근거로 답하세요.`
      : '')
  const messages = [
    { role: 'system', content: system },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.text })),
  ]

  // 1) 서버리스 프록시 (Vercel 빌드의 /api/groq) — 키가 서버에만 있어 안전.
  //    TEAM 스토어 빌드는 AI_PROXY 가 비어 있어 건너뛴다.
  if (AI_PROXY) {
    try {
      const r = await fetch(AI_PROXY, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
        const d = await r.json()
        if (d.text) return d.text
        if (d.error) throw new Error(d.error)
      }
    } catch (e) {
      // 프록시가 없거나(로컬) 실패하면 아래 직접 호출로 폴백
    }
  }

  // 2) Groq 원주소로 직접 호출.
  //    TEAM 스토어가 "팀 공용 API 키"로 대신 보내 주는 중이면(window.TEAM_SHARED_API) 키 없이 호출,
  //    아니면 localStorage 'apiKey' → 로컬 개발용 VITE_GROQ_API_KEY 순으로 키를 찾는다.
  const key = resolveGroqKey()
  if (key) {
    const r = await fetch(`${GROQ_BASE}/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 800 }),
    })
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) throw new Error('API 키가 올바르지 않아요. 키를 다시 확인해 주세요. (' + r.status + ')')
      throw new Error('Groq 요청 실패 (' + r.status + ')')
    }
    const d = await r.json()
    return d.choices?.[0]?.message?.content?.trim() || '(빈 응답)'
  }

  throw new Error(
    AI_PROXY
      ? 'AI가 아직 설정되지 않았어요. 배포 환경에 GROQ_API_KEY를 등록해 주세요.'
      : `AI가 아직 설정되지 않았어요. TEAM 스토어 관리 화면 → 팀 공용 API 키에 주소 ${GROQ_BASE} 와 키를 등록해 주세요. (앱이 키를 보관하는 이름: ${API_KEY_STORAGE})`,
  )
}

// 스토어가 키를 대신 붙여 주는지 (TEAM 스토어 지침 3-5)
export function isSharedApi() {
  try {
    return (window.TEAM_SHARED_API || []).some((a) => a?.base && GROQ_BASE.startsWith(a.base))
  } catch {
    return false
  }
}

function resolveGroqKey() {
  if (isSharedApi()) return 'team' // 실제 키는 스토어 서버가 붙인다
  try {
    const k = localStorage.getItem(API_KEY_STORAGE)
    if (k && k.trim()) return k.trim()
  } catch {}
  return GROQ_KEY
}
