export function WelcomeNotice({ me, onClose }) {
  return (
    <div className="notice-overlay" onClick={onClose}>
      <div className="notice-card" onClick={(e) => e.stopPropagation()}>
        <h2>📢 ADX 타운에 오신 걸 환영합니다!</h2>
        <p className="notice-hi">{me.avatar} <b>{me.nickname}</b> 님, 반가워요.</p>
        <ul>
          <li>🕹️ <b>방향키 / WASD</b>(모바일은 D패드)로 캐릭터를 움직이세요.</li>
          <li>🎙️ 상단 <b>음성</b> 버튼을 켜면 3칸 이내 사람과 자동으로 음성 대화가 연결됩니다.</li>
          <li>💬 <b>/</b> 키로 채팅 포커스, <b>Esc</b>로 해제. 보낸 말은 머리 위에 뜹니다.</li>
          <li>📺 대형 스크린을 클릭해 <b>사진 공유</b>, 사진 위에 <b>낙서</b>도 가능해요.</li>
          <li>✏️ 그룹 하단 <b>화이트보드</b>에 글을 쓰면 모두에게 보입니다. 상단에서 <b>대회의실</b>로 다같이 이동도 가능!</li>
        </ul>
        <button className="notice-ok" onClick={onClose}>입장하기</button>
      </div>
    </div>
  )
}
