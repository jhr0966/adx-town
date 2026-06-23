// 현재 활동 상태 배너 — "운동 중 💪" + 그만두기. 활동 중에만 표시.
export default function ActivityOverlay({ activity, onStop }) {
  if (!activity) return null
  return (
    <div className="activity-overlay">
      <span className="ao-dot" />
      <span className="ao-label">{activity.label}</span>
      <button className="ao-stop" onClick={onStop}>그만두기</button>
    </div>
  )
}
