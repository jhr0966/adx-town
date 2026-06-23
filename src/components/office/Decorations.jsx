import { memo } from 'react'
import { TILE } from '../../constants'

// 분위기 파티클 — 온천 김(steam, ↑떠오름) / 게임존 반짝임(spark, 깜빡임).
// place.DECOR = [{ kind:'steam'|'spark', row, col }] 가 있을 때만 렌더.
export const Decorations = memo(function Decorations({ decor }) {
  if (!decor?.length) return null
  return (
    <>
      {decor.map((d, i) => (
        <span
          key={i}
          className={d.kind === 'steam' ? 'steam' : 'spark'}
          style={{
            left: (d.col + 0.5) * TILE,
            top: (d.row + 0.5) * TILE,
            animationDelay: `${(i % 5) * 0.55}s`,
          }}
        />
      ))}
    </>
  )
})
