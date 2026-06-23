import { useEffect, useRef, useState } from 'react'

// 아케이드 미니게임 — 10초 안에 반짝이는 버튼을 최대한 많이 누르기.
export default function ArcadeMiniGame({ onClose, onWin }) {
  const [phase, setPhase] = useState('ready') // ready | play | done
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(10)
  const [target, setTarget] = useState({ x: 50, y: 50 })
  const tick = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => () => clearInterval(tick.current), [])

  const start = () => {
    setPhase('play'); setScore(0); setTime(10)
    moveTarget()
    tick.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) { clearInterval(tick.current); setPhase('done'); return 0 }
        return t - 1
      })
    }, 1000)
  }
  const moveTarget = () => setTarget({ x: 12 + Math.random() * 76, y: 16 + Math.random() * 64 })
  const hit = () => { setScore((s) => s + 1); moveTarget() }

  useEffect(() => {
    if (phase === 'done' && score >= 8) onWin?.()
  }, [phase, score, onWin])

  return (
    <div className="mini-backdrop" onClick={onClose}>
      <div className="mini-modal" role="dialog" aria-modal="true" aria-label="아케이드 미니게임" onClick={(e) => e.stopPropagation()}>
        <div className="am-head">
          <h2>🕹️ 반응속도 게임</h2>
          <button className="am-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {phase === 'ready' && (
          <div className="mini-center">
            <p>10초 안에 반짝이는 버튼을 최대한 많이 누르세요!</p>
            <button className="mini-go" onClick={start}>시작</button>
          </div>
        )}

        {phase === 'play' && (
          <div className="mini-arena">
            <div className="mini-hud"><span>⏱ {time}s</span><span>⭐ {score}</span></div>
            <button
              className="mini-target"
              style={{ left: `${target.x}%`, top: `${target.y}%` }}
              onClick={hit}
              aria-label="누르기"
            >●</button>
          </div>
        )}

        {phase === 'done' && (
          <div className="mini-center">
            <p className="mini-result">{score}점!</p>
            <p className="mini-grade">{score >= 8 ? '🏆 게임 마스터!' : score >= 4 ? '👍 제법인데요?' : '🙂 다시 도전!'}</p>
            <div className="mini-row">
              <button className="mini-go" onClick={start}>다시</button>
              <button className="mini-ghost" onClick={onClose}>닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
