import { useEffect } from 'react'
import { ANNEX_FLOORS } from '../../constants'

// 별관 층 선택 모달 — 카드형, ESC/바깥클릭 닫기, 현재 층 배지.
export default function AnnexFloorModal({ current, onPick, onClose }) {
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
        aria-label="별관 층 선택"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="am-head">
          <h2>🏬 별관</h2>
          <button className="am-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <p className="am-sub">가고 싶은 층을 고르세요. 별관 이동은 개인 이동이라 다른 사람 화면은 바뀌지 않아요.</p>
        <div className="am-grid">
          {ANNEX_FLOORS.map((f) => {
            const here = current === f.key
            return (
              <button
                key={f.key}
                className={'am-card' + (here ? ' here' : '')}
                onClick={() => onPick(f.key)}
                aria-label={f.name}
              >
                <span className="am-icon">{f.icon}</span>
                <span className="am-name">
                  {f.name}
                  {here && <span className="am-badge">현재 위치</span>}
                </span>
                <span className="am-desc">{f.desc}</span>
                <span className="am-tags">
                  {f.tags.map((t) => <span key={t} className="am-tag">{t}</span>)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
