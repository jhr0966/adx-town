import { useMemo } from 'react'

const PALETTE = ['var(--accent)', 'var(--accent-2)', 'var(--st-focus)', 'var(--st-free)', 'var(--st-meeting)']

// 축하 컨페티 한 번 터짐 — 박수(F)/🎉 이모트 시. key 를 바꿔 리마운트하면 다시 재생.
export default function Confetti({ count = 90 }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        bg: PALETTE[(Math.random() * PALETTE.length) | 0],
        delay: Math.random() * 0.5,
        dur: 1.8 + Math.random() * 1.4,
        rot: Math.random() * 360,
      })),
    [count],
  )
  return (
    <div className="confetti-layer">
      {bits.map((b, i) => (
        <div
          key={i}
          className="confetti-bit"
          style={{
            left: `${b.left}%`,
            background: b.bg,
            transform: `rotate(${b.rot}deg)`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
