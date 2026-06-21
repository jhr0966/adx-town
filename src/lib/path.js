import { isWall } from '../constants'

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const key = (r, c) => r + ',' + c

// 시작 → 목표 최단 경로(BFS). 시작 칸 제외, 목표 칸 포함한 단계 배열. 불가능하면 null.
export function bfsPath(place, start, goal) {
  if (start.row === goal.row && start.col === goal.col) return []
  const prev = new Map()
  prev.set(key(start.row, start.col), null)
  const q = [start]
  let found = false
  while (q.length) {
    const cur = q.shift()
    if (cur.row === goal.row && cur.col === goal.col) { found = true; break }
    for (const [dr, dc] of DIRS) {
      const nr = cur.row + dr, nc = cur.col + dc
      if (nr < 0 || nc < 0 || nr >= place.ROWS || nc >= place.COLS) continue
      const k = key(nr, nc)
      if (prev.has(k)) continue
      if (isWall(place, nr, nc)) continue
      prev.set(k, cur)
      q.push({ row: nr, col: nc })
    }
  }
  if (!found) return null
  const path = []
  let cur = goal
  while (cur && !(cur.row === start.row && cur.col === start.col)) {
    path.push(cur)
    cur = prev.get(key(cur.row, cur.col))
  }
  return path.reverse()
}

// 목표가 벽이면 가장 가까운 걸어갈 수 있는 칸을 찾아 반환 (반경 4까지)
export function nearestWalkable(place, row, col) {
  if (!isWall(place, row, col)) return { row, col }
  for (let rad = 1; rad <= 4; rad++) {
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue // ring only
        const nr = row + dr, nc = col + dc
        if (nr < 0 || nc < 0 || nr >= place.ROWS || nc >= place.COLS) continue
        if (!isWall(place, nr, nc)) return { row: nr, col: nc }
      }
    }
  }
  return null
}
