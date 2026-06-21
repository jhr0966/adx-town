import { memo } from 'react'
import { TILE } from '../../constants'

// 아바타 — 말풍선/이모트/음성 게이지 포함. props 동일하면 리렌더 생략(메모).
export const Avatar = memo(function Avatar({ state, isMe, bubble, emote, voice, level = 0, stunned }) {
  if (state.row == null || state.col == null) return null
  const speaking = voice && level > 0.12
  return (
    <div
      className={'avatar' + (isMe ? ' me' : '') + (voice ? ' voice' : '') + (speaking ? ' speaking' : '') + (stunned ? ' stunned' : '')}
      style={{ left: state.col * TILE, top: state.row * TILE, width: TILE, height: TILE }}
    >
      {stunned && <div className="stun">💫</div>}
      {/* key=ts 로 매 이모트마다 리마운트 → 애니메이션 재생 (연속 전송 시에도 보이게) */}
      {emote && <div className="emote" key={emote.ts}>{emote.emoji}</div>}
      {bubble && <div className="bubble">{bubble}</div>}
      {voice && (
        <div className="mic-gauge" title="마이크 음량">
          <div className="mic-fill" style={{ height: `${Math.min(100, Math.round(level * 100))}%` }} />
        </div>
      )}
      <div className="avatar-emoji">{state.avatar}</div>
      <div className="avatar-name" style={{ background: state.color }}>{state.nickname}</div>
    </div>
  )
})
