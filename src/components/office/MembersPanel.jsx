import { STATUS, STATUS_ORDER } from '../../constants'

// 멤버 로스터 + 내 상태(프레즌스) 전환 패널
export default function MembersPanel({ roster, myStatus, onStatus, placeLabel, onClose }) {
  return (
    <div className="members-panel">
      <div className="mp-head">
        <span>내 상태 · 멤버</span>
        <button className="mp-x" onClick={onClose} aria-label="닫기">✕</button>
      </div>

      <div className="status-grid">
        {STATUS_ORDER.map((id) => (
          <button
            key={id}
            className={'status-opt' + (myStatus === id ? ' on' : '')}
            onClick={() => onStatus(id)}
          >
            <span className="dot" style={{ background: STATUS[id].dot }} />
            {STATUS[id].label}
          </button>
        ))}
      </div>

      <div className="mp-label">접속 멤버 {roster.length}</div>
      <div className="roster">
        {roster.map((p) => {
          const st = STATUS[p.status] || STATUS.free
          return (
            <div key={p.id} className="roster-row">
              <span className="roster-face">
                {p.face}
                <span className="st-dot" style={{ background: st.dot }} />
              </span>
              <div className="info">
                <div className="nm">{p.name}{p.isMe ? ' (나)' : ''}</div>
                <div className="sub">{st.label} · {placeLabel}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
