// 💃 춤 · 👏 박수는 전용 동작(Office.sendEmote)으로 연결. 개수는 적당히 줄임.
export const EMOJIS = ['💃', '👏', '👍', '❤️', '😂', '🎉', '🔥']

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
