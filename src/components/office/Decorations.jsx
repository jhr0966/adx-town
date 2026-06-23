import { memo } from 'react'
import { TILE } from '../../constants'

// 분위기 파티클 — kind 별 클래스로 CSS 애니메이션.
//   steam(온천 김↑) / spark(반짝임) / ember(불씨↑) / star(야경 별)
// place.DECOR = [{ kind, row, col }] 가 있을 때만 렌더.
export const Decorations = memo(function Decorations({ decor }) {
  if (!decor?.length) return null
  return (
    <>
      {decor.map((d, i) => (
        <span
          key={i}
          className={'fx ' + d.kind}
          style={{
            left: (d.col + 0.5) * TILE,
            top: (d.row + 0.5) * TILE,
            animationDelay: `${(i % 5) * 0.5}s`,
          }}
        />
      ))}
    </>
  )
})
