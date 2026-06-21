import { EMOJIS } from './EmotePicker'

// PC 하단 이모지 플로팅 바 — 클릭하면 바로 감정표현 전송 (모바일은 CSS로 숨김)
export function EmoteBar({ onPick }) {
  return (
    <div className="emote-bar">
      {EMOJIS.map((em) => (
        <button key={em} onClick={() => onPick(em)} aria-label={`감정표현 ${em}`}>
          {em}
        </button>
      ))}
    </div>
  )
}
