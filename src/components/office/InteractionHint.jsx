// 가까운 상호작용 안내 칩 — PC는 E키, 모바일은 칩을 눌러 실행.
export default function InteractionHint({ interaction, onRun }) {
  if (!interaction) return null
  return (
    <button
      className="interact-hint"
      onClick={() => onRun(interaction)}
      aria-label={interaction.label}
    >
      <span className="ih-key">E</span>
      <span className="ih-label">{interaction.label.replace(/^E:\s*/, '')}</span>
    </button>
  )
}
