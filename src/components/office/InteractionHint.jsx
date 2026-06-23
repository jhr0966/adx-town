// 가까운 상호작용 안내 칩 — PC는 Space 키, 모바일은 칩을 눌러 실행.
// ih-key(Space 표기)는 터치 환경에선 CSS로 숨기고 라벨 버튼만 보인다.
export default function InteractionHint({ interaction, onRun }) {
  if (!interaction) return null
  return (
    <button
      className="interact-hint"
      onClick={() => onRun(interaction)}
      aria-label={interaction.label}
    >
      <span className="ih-key">Space</span>
      <span className="ih-label">{interaction.label}</span>
    </button>
  )
}
