// env(.env)가 있으면 그걸 쓰고, 없으면(예: Vercel 빌드) 아래 기본값 사용.
// publishable 키와 URL은 공개용이라 브라우저 번들에 노출돼도 안전합니다.
const DEFAULT_URL = 'https://ilrjtqcgvaucocfralgu.supabase.co'
const DEFAULT_KEY = 'sb_publishable_Kmxvjo5tPmWRZ2PjukWdcA_iyKg3ap0'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY

// 두 값이 모두 채워져 있으면 실제 멀티유저(Supabase) 모드
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// ── WebRTC ICE 서버 ──
// 기본은 공개 STUN. 까다로운 NAT/방화벽 환경에서 음성을 안정화하려면
// .env 에 TURN 서버 정보를 넣으면 자동으로 추가된다 (예: Twilio NTS, coturn).
const TURN_URL = import.meta.env.VITE_TURN_URL || ''
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || ''
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || ''

export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  ...(TURN_URL ? [{ urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL }] : []),
]

// AI 봇(Groq). 운영은 /api/groq 서버리스 프록시(키 비노출) 권장.
// 로컬 개발용으로만 VITE_GROQ_API_KEY 직접 호출 폴백 (브라우저 노출됨).
export const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
