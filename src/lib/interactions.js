// 가장 가까운(반경 안) 상호작용 하나를 찾는다. 없으면 null.
// 체비셰프 거리(맵 격자 이동과 일치) 기준.
export function getNearbyInteraction(pos, interactions) {
  if (!pos || !interactions?.length) return null
  let best = null
  let bestD = Infinity
  for (const it of interactions) {
    const d = Math.max(Math.abs(it.row - pos.row), Math.abs(it.col - pos.col))
    if (d <= (it.radius ?? 1.6) && d < bestD) { best = it; bestD = d }
  }
  return best
}
