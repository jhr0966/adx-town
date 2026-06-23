// 화면 하단 토스트 메시지 (기존 둥근 카드 스타일). 자동 사라짐은 Office에서 타이머로.
export default function OfficeToast({ toast }) {
  if (!toast) return null
  return (
    <div className="office-toast" key={toast.ts} role="status">
      {toast.text}
    </div>
  )
}
