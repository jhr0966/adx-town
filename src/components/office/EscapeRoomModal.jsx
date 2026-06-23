import { useEffect, useState } from 'react'

// 방탈출 — 단서 3개를 조합해 3자리 비밀번호 입력. 정답 = 고양이4 + 캠프파이어1 + 별3 → "413".
const ANSWER = '413'
const CLUES = [
  '🐱 4F 펫파크의 고양이는 모두 네 마리.',
  '🔥 RF 옥상엔 캠프파이어가 단 하나.',
  '⭐ 밤하늘 별 세 개가 키패드 위에 떠 있다.',
]

export default function EscapeRoomModal({ onClose, onWin }) {
  const [code, setCode] = useState('')
  const [shake, setShake] = useState(false)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = () => {
    if (code === ANSWER) {
      setSolved(true)
      onWin?.()
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setCode('')
    }
  }

  return (
    <div className="mini-backdrop" onClick={onClose}>
      <div
        className={'escape-modal' + (shake ? ' shake' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="방탈출"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="am-head">
          <h2>🔒 방탈출</h2>
          <button className="am-x" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        {solved ? (
          <div className="mini-center">
            <p className="mini-result">탈출 성공 🎉</p>
            <p className="mini-grade">단서를 모두 풀어냈어요!</p>
            <button className="mini-go" onClick={onClose}>나가기</button>
          </div>
        ) : (
          <>
            <p className="am-sub">단서 3개를 조합해 비밀번호(숫자 3자리)를 입력하세요.</p>
            <ul className="escape-clues">
              {CLUES.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
            <div className="escape-keypad">
              <div className="escape-display">{code.padEnd(3, '•')}</div>
              <div className="escape-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK'].map((k) => (
                  <button
                    key={k}
                    className="escape-key"
                    onClick={() => {
                      if (k === '←') setCode((c) => c.slice(0, -1))
                      else if (k === 'OK') submit()
                      else if (code.length < 3) setCode((c) => c + k)
                    }}
                  >{k}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
