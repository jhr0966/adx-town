import { useEffect, useRef } from 'react'

// 스크린 사진 풀스크린 보기 — 낙서(strokes)도 같은 비율로 겹쳐 표시 + 실시간 동기화.
// 스크린 프레임과 동일한 가로:세로 비율 + object-fit:cover 라 좌표가 정확히 맞는다.
export function ScreenLightbox({ photo, strokes, rect, onClose }) {
  const canvasRef = useRef(null)
  const W = 1600
  const H = Math.round((1600 * rect.h) / rect.w)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokes) {
      if (!s.points || s.points.length < 1) continue
      ctx.strokeStyle = s.color || '#ef4444'
      ctx.lineWidth = Math.max(4, W * 0.005)
      ctx.beginPath()
      s.points.forEach((p, i) => {
        const x = p.x * W, y = p.y * H
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      })
      ctx.stroke()
    }
  }, [strokes, W, H])

  // 92vw × 88vh 안에 스크린 비율을 유지하며 최대 크기로
  const aspect = rect.w / rect.h
  const maxW = (typeof window !== 'undefined' ? window.innerWidth : 1280) * 0.92
  const maxH = (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.88
  let boxW = maxW, boxH = maxW / aspect
  if (boxH > maxH) { boxH = maxH; boxW = maxH * aspect }

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="screen-full" style={{ width: boxW, height: boxH }}>
        <img src={photo} alt="공유 사진" />
        <canvas ref={canvasRef} width={W} height={H} />
      </div>
    </div>
  )
}
