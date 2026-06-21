// 실시간 통신 추상화 계층.
//
// 동일한 인터페이스(Room)를 두 가지 백엔드로 제공한다:
//   1) Supabase Realtime  — 다른 기기/사람과 진짜 멀티유저 (env 설정 시)
//   2) BroadcastChannel   — 같은 브라우저의 여러 탭끼리 통신 (로컬 프로토타입)
//
// Room 인터페이스:
//   room.updateState(partial)        내 상태(위치 등) 갱신 → 다른 참가자에게 전파
//   room.sendChat({ text, photo })   채팅/사진 전송
//   room.onPeers(cb)                 참가자 목록(자신 제외)이 바뀔 때 호출, Map<id, state>
//   room.onChat(cb)                  새 채팅 메시지 도착 시 호출
//   room.leave()                     퇴장

import { createClient } from '@supabase/supabase-js'
import { HAS_SUPABASE, SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export function createRoom({ roomId, me }) {
  return HAS_SUPABASE
    ? createSupabaseRoom({ roomId, me })
    : createLocalRoom({ roomId, me })
}

// Supabase 클라이언트는 앱 전체에서 하나만 사용 (중복 연결 방지)
let _supabase = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 20 } },
    })
  }
  return _supabase
}

// ──────────────────────────────────────────────
// 공통: 콜백 보관용 작은 이벤트 허브
// ──────────────────────────────────────────────
function makeEmitter() {
  const cbs = {}
  const noop = () => {}
  return {
    on: (ev, cb) => { cbs[ev] = cb },
    emit: (ev, data) => (cbs[ev] || noop)(data),
  }
}

// ──────────────────────────────────────────────
// 1) Supabase Realtime 백엔드
// ──────────────────────────────────────────────
function createSupabaseRoom({ roomId, me }) {
  const em = makeEmitter()
  let myState = { ...me }
  const supabase = getSupabase()

  // presence는 이 프로젝트에서 2명 이상이면 ~25초 후 연결을 끊어버린다(검증됨).
  // 그래서 presence를 쓰지 않고 broadcast만으로 명단·위치·채팅을 모두 처리한다.
  const channel = supabase.channel(`office:${roomId}`, {
    config: { broadcast: { self: false } }, // 내 broadcast는 내가 다시 받지 않음(로컬 echo로 처리)
  })

  // 참가자 상태를 직접 관리. 하트비트(주기적 move broadcast)로 생존을 알리고,
  // GRACE 시간 넘게 신호가 없으면 퇴장 처리한다.
  const GRACE = 30000 // broadcast 지연/소켓 재접속 공백에 견디는 유예 (하트비트 3초 → 연결 중엔 안전)
  const peerStates = new Map() // id -> { ...state, _seen }
  const emitPeers = () => {
    const out = new Map()
    for (const [id, s] of peerStates) out.set(id, s)
    em.emit('peers', out)
  }
  const seePeer = (id, state) => peerStates.set(id, { ...state, _seen: Date.now() })
  const sendMove = () =>
    channel.send({ type: 'broadcast', event: 'move', payload: { from: me.id, state: myState } })

  // 새 참가자 입장: 상태 등록 + 내 상태를 즉시 알려 서로 바로 보이게
  channel.on('broadcast', { event: 'join' }, ({ payload }) => {
    if (!payload || payload.from === me.id) return
    seePeer(payload.from, payload.state)
    emitPeers()
    sendMove()
    em.emit('join', payload.from) // 화이트보드/스크린 등 현재 상태 재전송용
  })

  // 위치/생존 신호
  channel.on('broadcast', { event: 'move' }, ({ payload }) => {
    if (!payload || payload.from === me.id) return
    seePeer(payload.from, payload.state)
    emitPeers()
  })

  // 명시적 퇴장
  channel.on('broadcast', { event: 'bye' }, ({ payload }) => {
    if (payload && peerStates.delete(payload.from)) emitPeers()
  })

  channel.on('broadcast', { event: 'chat' }, ({ payload }) => em.emit('chat', payload))
  channel.on('broadcast', { event: 'screen' }, ({ payload }) => em.emit('screen', payload))
  channel.on('broadcast', { event: 'board' }, ({ payload }) => em.emit('board', payload))
  channel.on('broadcast', { event: 'emote' }, ({ payload }) => em.emit('emote', payload))
  channel.on('broadcast', { event: 'draw' }, ({ payload }) => em.emit('draw', payload))
  channel.on('broadcast', { event: 'place' }, ({ payload }) => em.emit('place', payload))
  channel.on('broadcast', { event: 'cursor' }, ({ payload }) => em.emit('cursor', payload))
  channel.on('broadcast', { event: 'rtc' }, ({ payload }) => em.emit('rtc', payload))
  channel.on('broadcast', { event: 'announce' }, ({ payload }) => em.emit('announce', payload))
  channel.on('broadcast', { event: 'rock' }, ({ payload }) => em.emit('rock', payload))

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({ type: 'broadcast', event: 'join', payload: { from: me.id, state: myState } })
    }
  })

  // 하트비트: 가만히 있어도 3초마다 생존 신호 → 상대의 _seen 갱신
  const heartbeat = setInterval(sendMove, 3000)

  // GRACE 넘게 신호 없는 참가자 퇴장 처리.
  // 단, 내 채널이 정상(joined)일 때만 — 내 연결이 끊긴 동안엔 남을 퇴장 처리하지 않음
  // (소켓이 ~25초마다 잠깐 재접속하며 신호 공백이 생겨도 헛 "나갔습니다"를 띄우지 않게).
  const cleaner = setInterval(() => {
    if (channel.state !== 'joined') return
    const now = Date.now()
    let changed = false
    for (const [id, s] of peerStates) {
      if (now - s._seen > GRACE) { peerStates.delete(id); changed = true }
    }
    if (changed) emitPeers()
  }, 3000)

  // 이동 broadcast는 합쳐서 초당 ~10개로 제한 (메시지 폭주 방지)
  const SEND_INTERVAL = 100
  let lastSent = 0
  let pending = false
  const flushMove = () => {
    lastSent = Date.now()
    pending = false
    sendMove()
  }

  const send = (event, payload) => channel.send({ type: 'broadcast', event, payload })

  return {
    onPeers: (cb) => em.on('peers', cb),
    onChat: (cb) => em.on('chat', cb),
    onScreen: (cb) => em.on('screen', cb),
    onBoard: (cb) => em.on('board', cb),
    onEmote: (cb) => em.on('emote', cb),
    onDraw: (cb) => em.on('draw', cb),
    onPlace: (cb) => em.on('place', cb),
    onCursor: (cb) => em.on('cursor', cb),
    onRtc: (cb) => em.on('rtc', cb),
    onAnnounce: (cb) => em.on('announce', cb),
    onRock: (cb) => em.on('rock', cb),
    onJoin: (cb) => em.on('join', cb),
    updateState(partial) {
      myState = { ...myState, ...partial }
      const since = Date.now() - lastSent
      if (since >= SEND_INTERVAL) {
        flushMove()
      } else if (!pending) {
        pending = true
        setTimeout(flushMove, SEND_INTERVAL - since)
      }
    },
    sendChat(msg) {
      const payload = { ...msg, id: cryptoId(), from: me.id, sender: me.nickname, avatar: me.avatar, ts: Date.now() }
      em.emit('chat', payload) // 내 화면에도 즉시 표시
      send('chat', payload)
    },
    setScreen(state) {
      em.emit('screen', state)
      send('screen', state)
    },
    setBoard(payload) {
      em.emit('board', payload)
      send('board', payload)
    },
    sendEmote(payload) {
      em.emit('emote', payload)
      send('emote', payload)
    },
    sendDraw(payload) {
      send('draw', payload) // 그리는 본인은 로컬에서 직접 그리므로 echo 안 함
    },
    setPlace(place) {
      em.emit('place', place)
      send('place', place)
    },
    sendCursor(payload) {
      send('cursor', payload) // 내 커서는 실제 마우스로 보이므로 echo 안 함
    },
    sendRtc(payload) {
      send('rtc', payload) // WebRTC 시그널링
    },
    sendAnnounce(payload) {
      em.emit('announce', payload) // 내 화면에도 즉시 표시
      send('announce', payload)
    },
    sendRock(payload) {
      em.emit('rock', payload) // 내 화면에도 즉시 날아가는 돌 표시
      send('rock', payload)
    },
    leave() {
      clearInterval(heartbeat)
      clearInterval(cleaner)
      send('bye', { from: me.id })
      supabase.removeChannel(channel)
    },
  }
}

// ──────────────────────────────────────────────
// 2) BroadcastChannel 백엔드 (로컬 멀티탭)
// ──────────────────────────────────────────────
function createLocalRoom({ roomId, me }) {
  const em = makeEmitter()
  const bc = new BroadcastChannel(`office:${roomId}`)
  const peers = new Map() // id -> { state, lastSeen }
  let myState = { ...me }

  const announce = () => bc.postMessage({ type: 'state', id: me.id, state: myState })

  bc.onmessage = (e) => {
    const msg = e.data
    if (msg.id === me.id) return
    if (msg.type === 'state') {
      peers.set(msg.id, { state: msg.state, lastSeen: Date.now() })
      emitPeers()
    } else if (msg.type === 'hello') {
      announce() // 새 참가자에게 내 존재를 알림
      em.emit('join', msg.id) // 화이트보드/스크린 상태 재전송용
    } else if (msg.type === 'bye') {
      peers.delete(msg.id)
      emitPeers()
    } else if (['chat', 'screen', 'board', 'emote', 'draw', 'place', 'cursor', 'rtc', 'announce', 'rock'].includes(msg.type)) {
      em.emit(msg.type, msg.payload)
    }
  }

  function emitPeers() {
    const out = new Map()
    for (const [id, v] of peers) out.set(id, v.state)
    em.emit('peers', out)
  }

  // 오래 응답 없는 탭은 닫힌 것으로 간주하고 정리
  const prune = setInterval(() => {
    const now = Date.now()
    let changed = false
    for (const [id, v] of peers) {
      if (now - v.lastSeen > 6000) {
        peers.delete(id)
        changed = true
      }
    }
    if (changed) emitPeers()
  }, 2000)

  // 주기적 하트비트 (presence 유지)
  const heartbeat = setInterval(announce, 2500)

  bc.postMessage({ type: 'hello', id: me.id })
  announce()

  return {
    onPeers: (cb) => em.on('peers', cb),
    onChat: (cb) => em.on('chat', cb),
    onScreen: (cb) => em.on('screen', cb),
    onBoard: (cb) => em.on('board', cb),
    onEmote: (cb) => em.on('emote', cb),
    onDraw: (cb) => em.on('draw', cb),
    onPlace: (cb) => em.on('place', cb),
    onCursor: (cb) => em.on('cursor', cb),
    onRtc: (cb) => em.on('rtc', cb),
    onAnnounce: (cb) => em.on('announce', cb),
    onRock: (cb) => em.on('rock', cb),
    onJoin: (cb) => em.on('join', cb),
    updateState(partial) {
      myState = { ...myState, ...partial }
      announce()
    },
    sendChat(msg) {
      const payload = { ...msg, id: cryptoId(), from: me.id, sender: me.nickname, avatar: me.avatar, ts: Date.now() }
      em.emit('chat', payload)
      bc.postMessage({ type: 'chat', payload })
    },
    setScreen(state) {
      em.emit('screen', state)
      bc.postMessage({ type: 'screen', payload: state })
    },
    setBoard(payload) {
      em.emit('board', payload)
      bc.postMessage({ type: 'board', payload })
    },
    sendEmote(payload) {
      em.emit('emote', payload)
      bc.postMessage({ type: 'emote', payload })
    },
    sendDraw(payload) {
      bc.postMessage({ type: 'draw', payload })
    },
    setPlace(place) {
      em.emit('place', place)
      bc.postMessage({ type: 'place', payload: place })
    },
    sendCursor(payload) {
      bc.postMessage({ type: 'cursor', payload })
    },
    sendRtc(payload) {
      bc.postMessage({ type: 'rtc', payload })
    },
    sendAnnounce(payload) {
      em.emit('announce', payload)
      bc.postMessage({ type: 'announce', payload })
    },
    sendRock(payload) {
      em.emit('rock', payload)
      bc.postMessage({ type: 'rock', payload })
    },
    leave() {
      bc.postMessage({ type: 'bye', id: me.id })
      clearInterval(prune)
      clearInterval(heartbeat)
      bc.close()
    },
  }
}

function cryptoId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()).slice(2)
}

// ──────────────────────────────────────────────
// 로비(방 디렉터리) — 공유 채널 'town-lobby'
//
// 방에 있는 클라이언트가 주기적으로 beat({ roomId, name, count })를 보낸다.
// 로비 화면은 beat를 모아 목록을 만들고, 마지막 beat 후 LOBBY_GRACE(60s)가 지나면
// (= 그 방에서 모두 나가 beat가 끊기면) 목록에서 제거한다.
//   lobby.beat(info)     내 방을 광고(Office에서 주기 호출)
//   lobby.onRooms(cb)    방 목록이 바뀔 때 호출 (RoomLobby에서 사용)
//   lobby.leave()        정리
// ──────────────────────────────────────────────
const LOBBY_GRACE = 60000

// roomId의 랜덤 접미사(-xxxxxx)를 떼어 보기 좋은 기본 이름
export function prettyRoomName(id) {
  return (id || '').replace(/-[a-z0-9]{4,8}$/, '') || id
}
// roomId와 다른(=사용자가 지은) 이름을 우선 유지
function preferName(prev, incoming, roomId) {
  if (incoming && incoming !== roomId) return incoming
  if (prev && prev !== roomId) return prev
  return incoming || prev || roomId
}

export function createLobby() {
  return HAS_SUPABASE ? createSupabaseLobby() : createLocalLobby()
}

function makeLobbyCore(emitRooms) {
  const rooms = new Map() // id -> { id, name, count, seen }
  const onBeat = (p) => {
    if (!p?.roomId) return
    const prev = rooms.get(p.roomId)
    rooms.set(p.roomId, {
      id: p.roomId,
      name: preferName(prev?.name, p.name, p.roomId),
      count: p.count ?? 1,
      seen: Date.now(),
    })
    emitRooms(list())
  }
  const list = () =>
    [...rooms.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const prune = () => {
    const now = Date.now()
    let changed = false
    for (const [id, r] of rooms) if (now - r.seen > LOBBY_GRACE) { rooms.delete(id); changed = true }
    if (changed) emitRooms(list())
  }
  return { onBeat, list, prune }
}

function createSupabaseLobby() {
  const em = makeEmitter()
  const supabase = getSupabase()
  const core = makeLobbyCore((l) => em.emit('rooms', l))
  const channel = supabase.channel('town-lobby', { config: { broadcast: { self: false } } })
  channel.on('broadcast', { event: 'beat' }, ({ payload }) => core.onBeat(payload))
  channel.subscribe()
  const pruneTimer = setInterval(core.prune, 5000)
  return {
    onRooms: (cb) => { em.on('rooms', cb); cb(core.list()) },
    beat: (info) => channel.send({ type: 'broadcast', event: 'beat', payload: info }),
    leave: () => { clearInterval(pruneTimer); supabase.removeChannel(channel) },
  }
}

function createLocalLobby() {
  const em = makeEmitter()
  const core = makeLobbyCore((l) => em.emit('rooms', l))
  const bc = new BroadcastChannel('town-lobby')
  bc.onmessage = (e) => { if (e.data?.type === 'beat') core.onBeat(e.data.payload) }
  const pruneTimer = setInterval(core.prune, 5000)
  return {
    onRooms: (cb) => { em.on('rooms', cb); cb(core.list()) },
    beat: (info) => bc.postMessage({ type: 'beat', payload: info }),
    leave: () => { clearInterval(pruneTimer); bc.close() },
  }
}
