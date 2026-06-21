import { useLayoutEffect, useState } from 'react'
import { TILE } from '../constants'

export const ZOOM_STEPS = [1, 1.25, 1.5, 1.9, 2.4] // 단계별 확대 배율

// 작은 화면(모바일) 여부
export function isSmallScreen() {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}
export const defaultZoomIdx = () => (isSmallScreen() ? 0 : 3) // 모바일은 낮게, PC는 1.9배

// 카메라(맵 transform) 계산 — follow(확대 추적) / overview(전체보기)
// stageRef 뷰포트 안에서 내 위치(pos)를 중앙에 두거나 맵 전체를 맞춘다.
export function useCamera(stageRef, place, { pos, view, zoomIdx, chatOpen }) {
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 })

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const recompute = () => {
      const vw = stage.clientWidth, vh = stage.clientHeight
      const mapW = place.COLS * TILE, mapH = place.ROWS * TILE
      if (view === 'overview') {
        const scale = Math.min(vw / mapW, vh / mapH) * 0.96
        setCam({ x: (vw - mapW * scale) / 2, y: (vh - mapH * scale) / 2, scale })
        return
      }
      const scale = ZOOM_STEPS[zoomIdx]
      let x = vw / 2 - (pos.col + 0.5) * TILE * scale
      let y = vh / 2 - (pos.row + 0.5) * TILE * scale
      // 맵 밖 여백이 보이지 않게 클램프 (맵이 화면보다 크면)
      if (mapW * scale <= vw) x = (vw - mapW * scale) / 2
      else x = Math.max(vw - mapW * scale, Math.min(0, x))
      if (mapH * scale <= vh) y = (vh - mapH * scale) / 2
      else y = Math.max(vh - mapH * scale, Math.min(0, y))
      setCam({ x, y, scale })
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [stageRef, place, pos, view, zoomIdx, chatOpen])

  return cam
}
