import { memo } from 'react'
import { TILE } from '../../constants'

// 방 바닥 색을 "타일"이 아니라 방 전체를 덮는 배경 레이어로 그린다.
// → 화분·실타래 등 투명 장식 타일이 방 바닥색 위에 얹혀 이질감이 사라진다.
export const RoomTints = memo(function RoomTints({ tints }) {
  if (!tints?.length) return null
  return (
    <>
      {tints.map((t, i) => (
        <div
          key={i}
          className={'room-tint rt-' + t.k}
          style={{ left: t.col * TILE, top: t.row * TILE, width: t.w * TILE, height: t.h * TILE }}
        />
      ))}
    </>
  )
})
