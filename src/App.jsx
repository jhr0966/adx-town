import { useState } from 'react'
import Landing from './components/Landing'
import RoomLobby from './components/RoomLobby'
import EntryScreen from './components/EntryScreen'
import Office from './components/Office'
import ThemeSwitcher from './components/ThemeSwitcher'
import { HAS_SUPABASE } from './lib/config'
import { getRoomFromUrl, syncUrl } from './lib/room'

// 공유 링크(?room=...)로 들어오면 랜딩·로비를 건너뛰고 바로 그 방으로 입장
const urlRoom = getRoomFromUrl() // { id, name } | null

export default function App() {
  const [phase, setPhase] = useState(urlRoom ? 'entry' : 'landing') // landing | lobby | entry
  const [room, setRoom] = useState(urlRoom || null) // { id, name }
  const [me, setMe] = useState(null) // { id, nickname, avatar, color }

  // 방 선택(생성/입장) → URL에 ?room= 반영(공유 가능) → 닉네임 입력으로
  const pickRoom = (id, name = null) => {
    setRoom({ id, name })
    syncUrl(id, name)
    setPhase('entry')
  }

  const inOffice = phase !== 'landing' && phase !== 'lobby' && !!me
  let screen
  if (phase === 'landing') screen = <Landing onStart={() => setPhase('lobby')} />
  else if (phase === 'lobby') screen = <RoomLobby onPick={pickRoom} onBack={() => setPhase('landing')} />
  else if (!me) {
    screen = (
      <EntryScreen
        roomId={room?.id}
        roomName={room?.name}
        onEnter={setMe}
        onBack={urlRoom ? null : () => setPhase('lobby')} // 공유 링크 입장 시엔 로비가 없음
      />
    )
  } else {
    screen = <Office me={me} roomId={room?.id} roomName={room?.name} onLeave={() => setMe(null)} />
  }

  return (
    <>
      {!inOffice && <ThemeSwitcher variant="float" />}
      {screen}
    </>
  )
}

export { HAS_SUPABASE }
