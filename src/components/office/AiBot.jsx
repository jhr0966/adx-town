import { memo } from 'react'
import { TILE } from '../../constants'

// 내 옆에 나타나는 AI 봇 아바타 (개인용 — 나에게만 보임). 소환/퇴장 애니메이션 + 말풍선.
export const AiBot = memo(function AiBot({ row, col, bubble, exiting }) {
  const text = bubble && bubble.length > 140 ? bubble.slice(0, 140) + '…' : bubble
  return (
    <div
      className={'avatar aibot ' + (exiting ? 'aibot-exit' : 'aibot-enter')}
      style={{ left: col * TILE, top: row * TILE, width: TILE, height: TILE }}
    >
      <span className="aibot-ring" />
      {text && <div className="bubble bot-bubble">{text}</div>}
      <div className="avatar-emoji"><span className="bot-face">🤖</span></div>
      <div className="avatar-name aibot-name">자비스</div>
    </div>
  )
})
