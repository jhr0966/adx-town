export const EMOJIS = ['👍', '👏', '🎉', '😂', '😍', '😮', '😢', '🔥', '❤️', '🙏', '👋', '💯']

export function EmotePicker({ onPick, onClose }) {
  return (
    <div className="emote-pop" onClick={onClose}>
      <div className="emote-grid" onClick={(e) => e.stopPropagation()}>
        {EMOJIS.map((em) => (
          <button key={em} onClick={() => onPick(em)}>{em}</button>
        ))}
      </div>
    </div>
  )
}
