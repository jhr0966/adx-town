import { useEffect, useRef, useState } from 'react'
import { TILE } from '../../constants'

// 대형 스크린(액자) — 사진 표시 + 낙서(그리기)
const DRAW_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#111111', '#ffffff']

export function LargeScreen({ rect, screen, strokes, onUpload, onPaste, onClear, onEnlarge, onAddStroke, onClearDraw }) {
  const W = rect.w * TILE
  const H = rect.h * TILE
  const style = { left: rect.col * TILE, top: rect.row * TILE, width: W, height: H }
  const [drawMode, setDrawMode] = useState(false)
  const [color, setColor] = useState(DRAW_COLORS[0])
  const canvasRef = useRef(null)
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes
  const curRef = useRef(null)

  const paint = (current) => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const drawStroke = (s) => {
      if (!s.points || s.points.length < 1) return
      ctx.strokeStyle = s.color || '#ef4444'
      ctx.lineWidth = 3
      ctx.beginPath()
      s.points.forEach((p, i) => {
        const x = p.x * W, y = p.y * H
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
    }
    strokesRef.current.forEach(drawStroke)
    if (current) drawStroke(current)
  }
  useEffect(() => { paint() }) // strokes 변경 시 다시 그림

  const ptr = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }
  const onDown = (e) => {
    if (!drawMode) return
    e.preventDefault()
    curRef.current = { points: [ptr(e)], color }
    canvasRef.current.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    if (!drawMode || !curRef.current) return
    curRef.current.points.push(ptr(e))
    paint(curRef.current)
  }
  const onUp = () => {
    const s = curRef.current
    curRef.current = null
    if (s && s.points.length > 1) onAddStroke(s)
  }

  if (!(screen && screen.photo)) {
    return (
      <div className="bigscreen bigscreen-blank" style={style}>
        <span className="blank-title">📺 사진 공유</span>
        <span className="blank-actions">
          <button className="bigscreen-empty" onClick={onUpload}>📁 파일</button>
          <button className="bs-paste" onClick={onPaste}>📋 붙여넣기</button>
        </span>
        <span className="blank-hint">또는 사진을 끌어다 놓거나 Ctrl+V</span>
      </div>
    )
  }
  return (
    <div className="bigscreen" style={style}>
      <img src={screen.photo} alt="공유 사진" onClick={!drawMode ? onEnlarge : undefined} />
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="bigscreen-canvas"
        style={{ pointerEvents: drawMode ? 'auto' : 'none', cursor: 'crosshair' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className="bigscreen-bar">
        <span className="bs-by">📷 {screen.by}</span>
        <span className="bigscreen-actions">
          {drawMode && DRAW_COLORS.map((c) => (
            <button
              key={c}
              className={'swatch' + (c === color ? ' on' : '')}
              style={{ background: c }}
              onClick={() => setColor(c)}
              title="펜 색"
            />
          ))}
          {drawMode && <button className="bs-btn" onClick={onClearDraw} title="낙서 지우기">🧹</button>}
          <button className={'bs-btn' + (drawMode ? ' on' : '')} onClick={() => setDrawMode((d) => !d)} title="낙서">✏️</button>
          <button className="bs-btn" onClick={onUpload} title="사진 바꾸기">🖼️</button>
          <button className="bs-btn" onClick={onPaste} title="클립보드 붙여넣기">📋</button>
          <button className="bs-btn" onClick={onClear} title="끄기">✕</button>
        </span>
      </div>
    </div>
  )
}
