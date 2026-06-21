import { memo, useEffect, useState } from 'react'
import { TILE } from '../../constants'

// 그룹 화이트보드 — 클릭하면 편집, 텍스트는 즉시 모두에게 표시
export const Whiteboard = memo(function Whiteboard({ board, text, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  useEffect(() => { if (!editing) setDraft(text) }, [text, editing])
  const style = {
    left: board.col * TILE,
    top: board.row * TILE,
    width: board.w * TILE,
    height: board.h * TILE,
  }
  const commit = () => { setEditing(false); onSave(board.idx, draft) }
  return (
    <div className="whiteboard" style={style}>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setDraft(text); setEditing(false) }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
          }}
        />
      ) : (
        <div className="wb-text" onClick={() => setEditing(true)}>
          {text ? text : <span className="wb-placeholder">✏️ 화이트보드</span>}
        </div>
      )}
    </div>
  )
})
