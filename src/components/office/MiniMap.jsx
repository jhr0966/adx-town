import { memo } from 'react'
import { TILE } from '../../constants'

const MM_W = 168

// 미니맵 — 맵 축소판 + 아바타 점 + 현재 화면 영역(뷰포트) 사각형.
export const MiniMap = memo(function MiniMap({ place, mePos, meColor, peers, cam, stageW, stageH }) {
  const mapW = place.COLS * TILE
  const mapH = place.ROWS * TILE
  const sc = MM_W / mapW
  const w = MM_W
  const h = Math.round(mapH * sc)

  const clamp = (v, max) => Math.max(0, Math.min(max, v))
  const vpW = stageW ? Math.min(w, (stageW / cam.scale) * sc) : w
  const vpH = stageH ? Math.min(h, (stageH / cam.scale) * sc) : h
  const vpLeft = clamp((-cam.x / cam.scale) * sc, w - vpW)
  const vpTop = clamp((-cam.y / cam.scale) * sc, h - vpH)

  const dot = (row, col, color, key, isMe) => (
    <div
      key={key}
      className="mm-dot"
      style={{
        left: (col + 0.5) * TILE * sc,
        top: (row + 0.5) * TILE * sc,
        background: color,
        width: isMe ? 7 : 6,
        height: isMe ? 7 : 6,
        zIndex: isMe ? 2 : 1,
      }}
    />
  )

  return (
    <div className="minimap" style={{ width: w, height: h }}>
      <div className="mm-vp" style={{ left: vpLeft, top: vpTop, width: vpW, height: vpH }} />
      {[...peers.entries()].map(([id, p]) =>
        p.row != null ? dot(p.row, p.col, p.color || 'var(--muted)', id, false) : null,
      )}
      {mePos && dot(mePos.row, mePos.col, meColor || 'var(--accent)', 'me', true)}
    </div>
  )
})
