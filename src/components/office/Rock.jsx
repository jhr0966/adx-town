import { memo, useEffect, useState } from 'react'
import { TILE } from '../../constants'

// 던진 돌 — 시작 칸에서 목표 칸으로 날아간다(살짝 호를 그리며 회전).
export const Rock = memo(function Rock({ rock }) {
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  const from = { x: (rock.fromCol + 0.5) * TILE, y: (rock.fromRow + 0.5) * TILE }
  const to = { x: (rock.toCol + 0.5) * TILE, y: (rock.toRow + 0.5) * TILE }
  const p = arrived ? to : from
  return (
    <div
      className={'rock-fly' + (arrived ? ' arrived' : '')}
      style={{
        left: p.x,
        top: p.y,
        transition: `left ${rock.dur}ms linear, top ${rock.dur}ms linear`,
      }}
    >
      🪨
    </div>
  )
})
