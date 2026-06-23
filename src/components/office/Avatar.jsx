import { memo } from 'react'
import { TILE, STATUS } from '../../constants'

// 아바타 — 말풍선/이모트/음성 게이지/프레즌스 상태 점 포함.
// props 동일하면 리렌더 생략(메모). 알(콩) 배경 없이 이모지 + 발밑 색 그림자.
// 활동별 머리 위 표시(아이콘). 없으면 클래스 애니메이션만.
// 온천(bath)은 머리 수건 + 반쯤 잠김으로 따로 렌더(아래). 나머지만 떠오르는 아이콘.
const ACT_ICON = { relax: '💤', lie: '😌', nap: '💤', eat: '🍚', campfire: '🔥' }

export const Avatar = memo(function Avatar({ state, isMe, bubble, emote, voice, level = 0, stunned, dancing, activity }) {
  if (state.row == null || state.col == null) return null
  const speaking = voice && level > 0.12
  const st = STATUS[state.status]
  const act = activity || state.activity || null
  return (
    <div
      className={
        'avatar' +
        (isMe ? ' me' : '') +
        (voice ? ' voice' : '') +
        (speaking ? ' speaking' : '') +
        (stunned ? ' stunned' : '') +
        (dancing ? ' dancing' : '') +
        (act ? ' act act-' + act.type : '')
      }
      style={{ left: state.col * TILE, top: state.row * TILE, width: TILE, height: TILE }}
    >
      {stunned && <div className="stun">💫</div>}
      {act?.type === 'bath' && <div className="bath-towel" />}
      {act && ACT_ICON[act.type] && <div className="act-icon">{ACT_ICON[act.type]}</div>}
      {/* key=ts 로 매 이모트마다 리마운트 → 애니메이션 재생 */}
      {emote && <div className="emote" key={emote.ts}>{emote.emoji}</div>}
      {bubble && <div className="bubble">{bubble}</div>}
      {voice && (
        <div className="mic-gauge" title="마이크 음량">
          <div className="mic-fill" style={{ height: `${Math.min(100, Math.round(level * 100))}%` }} />
        </div>
      )}
      <div className="avatar-pad" style={{ background: state.color }} />
      <div className="avatar-emoji">{state.avatar}</div>
      <div className="avatar-name" style={{ background: state.color }}>
        {st && <span className="st-dot" style={{ background: st.dot }} />}
        {state.nickname}
      </div>
    </div>
  )
})
