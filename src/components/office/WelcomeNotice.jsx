// 입장 안내 — 길게 설명하지 않고, 아이콘 + 한 줄로 핵심만.
const STEPS = [
  { icon: '🕹️', label: '이동', desc: '방향키 · WASD · D패드' },
  { icon: '⎵', label: '상호작용', desc: '가까이 가서 Space' },
  { icon: '🎙️', label: '음성', desc: '가까운 사람과 자동 연결' },
  { icon: '🏬', label: '별관', desc: '상단 버튼으로 룸 이동' },
]

export function WelcomeNotice({ me, onClose }) {
  return (
    <div className="notice-overlay" onClick={onClose}>
      <div className="notice-card welcome" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-hi">
          <span className="welcome-face">{me.avatar}</span>
          <b>{me.nickname}</b> 님, 환영해요!
        </div>
        <div className="welcome-steps">
          {STEPS.map((s) => (
            <div key={s.label} className="welcome-step">
              <span className="ws-icon">{s.icon}</span>
              <span className="ws-label">{s.label}</span>
              <span className="ws-desc">{s.desc}</span>
            </div>
          ))}
        </div>
        <button className="notice-ok" onClick={onClose}>시작하기</button>
      </div>
    </div>
  )
}
