import { GROQ_KEY } from './config'

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

  // 1) 서버리스 프록시 (Vercel /api/groq) — 키가 서버에만 있어 안전
  try {
    const r = await fetch('/api/groq', {
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

  // 2) 직접 호출 (로컬 개발: VITE_GROQ_API_KEY)
  if (GROQ_KEY) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 800 }),
    })
    if (!r.ok) throw new Error('Groq 요청 실패 (' + r.status + ')')
    const d = await r.json()
    return d.choices?.[0]?.message?.content?.trim() || '(빈 응답)'
  }

  throw new Error('AI가 아직 설정되지 않았어요. 배포 환경에 GROQ_API_KEY를 등록해 주세요.')
}
