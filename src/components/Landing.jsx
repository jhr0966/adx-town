import { AVATARS } from '../constants'

const FEATURES = [
  { icon: '🕹️', label: '자유 이동' },
  { icon: '🎙️', label: '근접 음성' },
  { icon: '📺', label: '화면 공유' },
  { icon: '✏️', label: '화이트보드' },
  { icon: '🖱️', label: '커서 공유' },
  { icon: '🎤', label: '대회의실' },
]

// 떠다니는 아바타 위치(고정)
const FLOATERS = [
  { a: '🦊', left: '8%', top: '22%', d: 0, dur: 7 },
  { a: '🐱', left: '82%', top: '18%', d: 1.2, dur: 8 },
  { a: '🐼', left: '15%', top: '70%', d: 0.6, dur: 9 },
  { a: '🐧', left: '88%', top: '66%', d: 2, dur: 7.5 },
  { a: '🦁', left: '72%', top: '78%', d: 1.6, dur: 8.5 },
  { a: '🐸', left: '26%', top: '14%', d: 0.3, dur: 6.5 },
  { a: '🦄', left: '50%', top: '8%', d: 1, dur: 9.5 },
]

export default function Landing({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-grid" />

      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="floater"
          style={{ left: f.left, top: f.top, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s` }}
        >
          {f.a}
        </span>
      ))}

      <div className="landing-content">
        <div className="landing-badge">✦ 함께 일하는 공간, 다시 설계하다</div>
        <h1 className="landing-title">
          <span className="t1">ADX</span> <span className="t2">TOWN</span>
        </h1>
        <p className="landing-sub">
          멀리 있어도 같은 공간에서 일합니다.<br />
          캐릭터로 거닐다 가까워지면 대화가 열리고,<br className="sub-br" />
          화면·음성·화이트보드로 자연스럽게 협업하세요.
        </p>

        <div className="landing-features">
          {FEATURES.map((f, i) => (
            <div key={f.label} className="feat-chip" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
              <span className="feat-icon">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        <button className="landing-cta" onClick={onStart}>
          입장하기 <span className="cta-arrow">→</span>
        </button>

        <div className="landing-avatars">
          {AVATARS.slice(0, 8).map((a, i) => (
            <span key={a} style={{ animationDelay: `${i * 0.15}s` }}>{a}</span>
          ))}
        </div>
      </div>

      <footer className="landing-foot">실시간 멀티플레이 · 근접 음성 · 화면 공유 · 화이트보드 · 커서 공유</footer>
    </div>
  )
}
