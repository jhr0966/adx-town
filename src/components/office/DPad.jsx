import { useEffect, useRef } from 'react'

const DIRS = [
  { cls: 'up', dr: -1, dc: 0, label: '▲' },
  { cls: 'left', dr: 0, dc: -1, label: '◀' },
  { cls: 'right', dr: 0, dc: 1, label: '▶' },
  { cls: 'down', dr: 1, dc: 0, label: '▼' },
]

// 터치 이동용 D-패드. 길게 누르면 연속 이동.
// 누른 채로 손가락을 떼지 않고 다른 방향 버튼으로 스와이프하면 그 방향으로 전환된다.
export function DPad({ onMove }) {
  const wrapRef = useRef(null)
  const pressed = useRef(false)
  const curCls = useRef(null)
  const timer = useRef(null)

  const clearTimer = () => { clearInterval(timer.current); timer.current = null }
  const setActive = (cls) =>
    wrapRef.current?.querySelectorAll('.dp').forEach((b) =>
      b.classList.toggle('active', b.dataset.dir === cls))

  const stop = () => {
    pressed.current = false
    curCls.current = null
    clearTimer()
    setActive(null)
  }

  // 좌표 아래에 있는 방향 버튼(.dp)의 방향. 패드 밖이면 null.
  const dirAt = (x, y) => {
    const btn = document.elementFromPoint(x, y)?.closest('.dp')
    return btn && wrapRef.current?.contains(btn) ? btn.dataset.dir : null
  }

  // 방향 전환(같으면 무시). cls=null이면 이동만 멈춤(손가락은 유지).
  const apply = (cls) => {
    if (cls === curCls.current) return
    clearTimer()
    curCls.current = cls
    setActive(cls)
    if (!cls) return
    const d = DIRS.find((x) => x.cls === cls)
    onMove(d.dr, d.dc)
    timer.current = setInterval(() => onMove(d.dr, d.dc), 160)
  }

  const onDown = (e) => {
    e.preventDefault()
    pressed.current = true
    try { wrapRef.current?.setPointerCapture?.(e.pointerId) } catch { /* 패드 밖 move 추적용 */ }
    apply(dirAt(e.clientX, e.clientY))
  }
  const onPointerMove = (e) => {
    if (!pressed.current) return
    e.preventDefault()
    apply(dirAt(e.clientX, e.clientY))
  }

  useEffect(() => stop, [])

  return (
    <div
      className="dpad"
      ref={wrapRef}
      onPointerDown={onDown}
      onPointerMove={onPointerMove}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      {DIRS.map((d) => (
        <button key={d.cls} className={'dp ' + d.cls} data-dir={d.cls} aria-label={d.label}>
          {d.label}
        </button>
      ))}
    </div>
  )
}
