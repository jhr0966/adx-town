import { memo } from 'react'

// 다른 사람의 마우스 커서 (맵 좌표에 표시 — 카메라/줌과 함께 움직임)
export const Cursor = memo(function Cursor({ c }) {
  return (
    <div className="cursor" style={{ left: c.x, top: c.y }}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M3 2l7 18 2.5-7.5L20 10z" fill={c.color || '#6366f1'} stroke="#fff" strokeWidth="1.5" />
      </svg>
      <span className="cursor-name" style={{ background: c.color }}>{c.nickname}</span>
    </div>
  )
})
