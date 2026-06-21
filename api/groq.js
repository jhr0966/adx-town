// Vercel 서버리스 함수 — Groq API 프록시 (키를 서버에만 보관, 브라우저 비노출)
// 환경변수 GROQ_API_KEY 필요 (Vercel 프로젝트 Settings → Environment Variables).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const key = process.env.GROQ_API_KEY
  if (!key) {
    res.status(500).json({ error: 'GROQ_API_KEY 가 설정되지 않았습니다.' })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const messages = body?.messages
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages 가 필요합니다.' })
      return
    }
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.6,
        max_tokens: 800,
      }),
    })
    const d = await r.json()
    if (!r.ok) {
      res.status(502).json({ error: d?.error?.message || 'Groq 오류' })
      return
    }
    res.status(200).json({ text: d.choices?.[0]?.message?.content?.trim() || '' })
  } catch (e) {
    res.status(500).json({ error: '프록시 처리 중 오류' })
  }
}
