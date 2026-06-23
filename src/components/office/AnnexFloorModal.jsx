import { useEffect } from 'react'
import { ROOMS } from '../../constants'

// 별관 룸 이동 모달 — 카드형, ESC/바깥클릭 닫기. 방 선택 시 내 위치만 개인 순간이동.
export default function AnnexFloorModal({ inAnnex, onPick, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="annex-modal-backdrop" onClick={onClose}>
      <div
        className="annex-modal"
        role="dialog"
        aria-modal="true"
        aria-label="별관 룸 이동"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="am-head">
          <h2>🏬 별관 — 룸 이동</h2>
          <button className="am-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <p className="am-sub">
          {inAnnex
            ? '가고 싶은 방을 고르세요. 내 위치만 이동하고 다른 사람 화면은 안 바뀝니다.'
            : '별관에 입장합니다. 방을 고르면 그 공간으로 바로 이동해요.'}
        </p>
        <div className="am-grid">
          {ROOMS.map((r) => (
            <button
              key={r.key}
              className="am-card"
              onClick={() => onPick(r.key)}
              aria-label={r.label}
            >
              <span className="am-icon">{r.icon}</span>
              <span className="am-name">{r.label}</span>
              <span className="am-desc">{r.desc}</span>
              <span className="am-tags">
                {r.tags.map((t) => <span key={t} className="am-tag">{t}</span>)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
