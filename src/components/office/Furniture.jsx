import { memo } from 'react'
import { TILE } from '../../constants'

// 큰 가구를 칸 단위가 아니라 하나의 이어진 사각으로 렌더(온천/당구대/테이블/카운터).
// 충돌은 그대로 타일(BLOCKING)이 담당하고, 비주얼만 이 레이어가 덮어 그린다.
const POCKETS = [
  [0, 0], [0, 1], [0.5, 0], [0.5, 1], [1, 0], [1, 1],
]

export const Furniture = memo(function Furniture({ objects }) {
  if (!objects?.length) return null
  return (
    <>
      {objects.map((o, i) => {
        const style = { left: o.col * TILE, top: o.row * TILE, width: o.w * TILE, height: o.h * TILE }
        if (o.kind === 'onsen') {
          return (
            <div key={i} className="furn furn-onsen" style={style}>
              <div className="furn-water" />
              <div className="furn-onsen-sign">♨️</div>
            </div>
          )
        }
        if (o.kind === 'pooltable') {
          return (
            <div key={i} className="furn furn-pooltable" style={style}>
              <div className="furn-felt" />
              {POCKETS.map(([fy, fx]) => (
                <span key={`${fy}-${fx}`} className="furn-pocket" style={{ top: `calc(${fy * 100}% - 7px)`, left: `calc(${fx * 100}% - 7px)` }} />
              ))}
              <div className="furn-8">8</div>
            </div>
          )
        }
        return (
          <div key={i} className={'furn furn-' + o.kind} style={style}>
            {o.emoji && <span className="furn-emoji">{o.emoji}</span>}
          </div>
        )
      })}
    </>
  )
})
