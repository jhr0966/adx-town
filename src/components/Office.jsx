import { useEffect, useRef, useState, useCallback } from 'react'
import { TILE, PLACES, PLACE_LIST, isWall } from '../constants'
import { createRoom, createLobby } from '../lib/realtime'
import { roomUrl } from '../lib/room'
import { pickImage, toShareableSrc } from '../lib/image'
import { bfsPath, nearestWalkable } from '../lib/path'
import { useAiBot } from '../hooks/useAiBot'
import { useCamera, ZOOM_STEPS, defaultZoomIdx, isSmallScreen } from '../hooks/useCamera'
import { useProximityVoice } from '../hooks/useProximityVoice'
import Chat from './Chat'
import { MapFloor, ZoneLabels } from './office/MapFloor'
import { Avatar } from './office/Avatar'
import { Cursor } from './office/Cursor'
import { Whiteboard } from './office/Whiteboard'
import { LargeScreen } from './office/LargeScreen'
import { DPad } from './office/DPad'
import { Rock } from './office/Rock'
import { EmotePicker } from './office/EmotePicker'
import { EmoteBar } from './office/EmoteBar'
import { Megaphone } from './office/Megaphone'
import { ScreenLightbox } from './office/ScreenLightbox'
import { AiBot } from './office/AiBot'
import { AiPanel } from './office/AiPanel'
import { WelcomeNotice } from './office/WelcomeNotice'

// 방 ID는 URL ?room=... 로 지정 가능(없으면 main). 여러 방 분리/테스트 격리에 사용
const URL_ROOM =
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('room')) ||
  null

export default function Office({ me, roomId, roomName, onLeave }) {
  const ROOM_ID = roomId || URL_ROOM || 'main'
  const [place, setPlace] = useState('office')
  const P = PLACES[place]
  const [pos, setPos] = useState(PLACES.office.START)
  const [view, setView] = useState('follow') // 'follow'(추적) | 'overview'(전체보기)
  const [zoomIdx, setZoomIdx] = useState(defaultZoomIdx)
  const [cursorMode, setCursorMode] = useState(false) // PC: 내 커서 공유
  const [cursors, setCursors] = useState({}) // userId -> { x, y, nickname, color, ts }
  const [myCursor, setMyCursor] = useState(null) // 모바일에서 내 커서 위치 표시
  const cursorModeRef = useRef(cursorMode)
  cursorModeRef.current = cursorMode
  const [peers, setPeers] = useState(new Map())
  const [messages, setMessages] = useState([])
  const [bubbles, setBubbles] = useState({}) // userId -> { text, ts }
  const [screen, setScreen] = useState(null) // 공유 화면 { photo, by }
  const [screenPreview, setScreenPreview] = useState(null) // 스크린 사진 확대 보기
  const [showNotice, setShowNotice] = useState(true) // 입장 환영 공지
  const [chatOpen, setChatOpen] = useState(() => !isSmallScreen()) // 모바일은 기본 닫힘
  const [chatMin, setChatMin] = useState(false) // 모바일: 입력창만 보이게 최소화
  const [unread, setUnread] = useState(0) // 채팅 닫힌 동안 안 읽은 메시지 수
  const [boards, setBoards] = useState({}) // 화이트보드 idx -> 텍스트
  const [emotes, setEmotes] = useState({}) // userId -> { emoji, ts }
  const [strokes, setStrokes] = useState([]) // 스크린 낙서 [{points,color}]
  const [showEmotes, setShowEmotes] = useState(false) // 이모지 피커 열림
  const [showMega, setShowMega] = useState(false) // 확성기 입력 열림
  const [announce, setAnnounce] = useState(null) // 전광판 { text, by, ts }
  const [rockMode, setRockMode] = useState(false) // 돌 던지기 스킬 (클릭→돌)
  const [rocks, setRocks] = useState([]) // 날아가는 돌 [{ id, from..,to.., dur }]
  const [stunned, setStunned] = useState({}) // userId -> 기절 만료 시각(ms)
  const rockModeRef = useRef(rockMode)
  rockModeRef.current = rockMode
  const throwRockRef = useRef(null) // 스테이지 핸들러에서 호출할 던지기 함수
  const lastThrowRef = useRef(0) // 쿨다운(1초)
  const stunUntilRef = useRef(0) // 내 기절 만료 시각 → 이동 차단
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const roomRef = useRef(null)
  const posRef = useRef(pos)
  posRef.current = pos
  const peersRef = useRef(peers)
  peersRef.current = peers
  const iSetScreenRef = useRef(false) // 내가 현재 화면을 띄운 사람인지
  const screenRef = useRef(null)
  screenRef.current = screen
  const prevPeersRef = useRef(null) // 입·퇴장 감지용 id->nickname (첫 sync 전엔 null)
  const chatOpenRef = useRef(chatOpen)
  chatOpenRef.current = chatOpen
  const stageRef = useRef(null)
  const boardsRef = useRef(boards)
  boardsRef.current = boards
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes
  const prevPhotoRef = useRef(null) // 스크린 사진 변경 감지(낙서 초기화용)
  const placeRef = useRef(place)
  placeRef.current = place

  // 카메라(맵 transform) — 훅으로 분리
  const cam = useCamera(stageRef, P, { pos, view, zoomIdx, chatOpen })
  const camRef = useRef(cam)
  camRef.current = cam

  // 근접 음성 — 훅으로 분리
  const { voiceOn, voicePeers, levels, toggleVoice, handleSignal: handleVoiceSignal } =
    useProximityVoice({ roomRef, me, pos, peers })

  // 자비스(AI 봇) — 훅으로 분리
  const {
    botOn, botExiting, botMsgs, botBusy, botBubble, botShared,
    toggleBot, closeBot, askBot, toggleShare,
  } = useAiBot({ roomRef, messagesRef })

  const openChat = useCallback(() => { setChatOpen(true); setUnread(0) }, [])
  const closeChat = useCallback(() => setChatOpen(false), [])

  // 방 초대 링크 복사(공유)
  const [shareCopied, setShareCopied] = useState(false)
  const shareLink = useCallback(async () => {
    const url = roomUrl(ROOM_ID)
    try {
      if (navigator.share && isSmallScreen()) {
        await navigator.share({ title: 'ADX 타운 초대', text: '같이 모여요!', url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('이 링크를 복사해 공유하세요', url) // 클립보드 권한 없을 때
      return
    }
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 1800)
  }, [ROOM_ID])

  // 방 입장 / 퇴장
  useEffect(() => {
    const room = createRoom({
      roomId: ROOM_ID,
      me: { ...me, ...PLACES.office.START },
    })
    roomRef.current = room
    room.onRtc(handleVoiceSignal) // 근접 음성 시그널링 → useProximityVoice

    const pushSystem = (text) =>
      setMessages((m) => [
        ...m.slice(-199),
        { id: (crypto.randomUUID && crypto.randomUUID()) || String(Math.random()), type: 'system', text, ts: Date.now() },
      ])

    room.onPeers((p) => {
      // 입·퇴장 공지 (첫 동기화 때는 기준만 잡고 알리지 않음)
      const prev = prevPeersRef.current
      if (prev) {
        for (const [id, st] of p) {
          if (!prev.has(id)) pushSystem(`${st.nickname || '누군가'}님이 입장했습니다 👋`)
        }
        for (const [id, nick] of prev) {
          if (!p.has(id)) pushSystem(`${nick}님이 나갔습니다`)
        }
      }
      prevPeersRef.current = new Map([...p].map(([id, st]) => [id, st.nickname]))
      setPeers(new Map(p))
    })
    // 새 참가자가 들어오면 현재 공유 상태(장소·화이트보드·스크린·낙서)를 재전송
    room.onJoin(() => {
      room.setPlace(placeRef.current)
      for (const [idx, text] of Object.entries(boardsRef.current)) {
        if (text) room.setBoard({ idx: Number(idx), text })
      }
      if (iSetScreenRef.current && screenRef.current?.photo) {
        room.setScreen(screenRef.current)
        room.sendDraw({ kind: 'init', strokes: strokesRef.current })
      }
    })
    // 장소 이동 — 모두 함께 이동
    room.onPlace((p) => {
      if (!PLACES[p] || p === placeRef.current) return
      setPlace(p)
      const st = PLACES[p].START
      setPos(st)
      roomRef.current?.updateState(st)
    })
    room.onScreen((s) => {
      setScreen(s)
      // 사진이 실제로 바뀌면 낙서 초기화 (같은 사진 재전송 시엔 유지)
      const photo = s?.photo || null
      if (photo !== prevPhotoRef.current) {
        prevPhotoRef.current = photo
        setStrokes([])
      }
    })
    room.onBoard(({ idx, text }) => setBoards((b) => ({ ...b, [idx]: text })))
    room.onEmote(({ from, emoji }) =>
      setEmotes((e) => ({ ...e, [from]: { emoji, ts: Date.now() } })),
    )
    room.onAnnounce((a) => setAnnounce({ ...a, shownAt: Date.now() }))
    room.onRock((rk) => {
      setRocks((rs) => [...rs, rk])
      // 임팩트 시점: 돌 제거 + 목표 칸에 있는 아바타(던진 사람 제외) 1초 기절
      setTimeout(() => {
        setRocks((rs) => rs.filter((r) => r.id !== rk.id))
        const hits = []
        const onTarget = (s) => s && s.row === rk.toRow && s.col === rk.toCol
        if (rk.by !== me.id && onTarget(posRef.current)) hits.push(me.id)
        for (const [id, s] of peersRef.current) {
          if (id !== rk.by && onTarget(s)) hits.push(id)
        }
        if (!hits.length) return
        const until = Date.now() + 1000
        if (hits.includes(me.id)) { stunUntilRef.current = until; stopAuto() } // 내 이동 차단
        setStunned((prev) => {
          const next = { ...prev }
          hits.forEach((id) => { next[id] = until })
          return next
        })
        setTimeout(() => setStunned((prev) => {
          const now = Date.now()
          const next = {}
          for (const [id, t] of Object.entries(prev)) if (t > now) next[id] = t
          return next
        }), 1050)
      }, rk.dur)
    })
    room.onDraw((d) => {
      if (d.kind === 'add') setStrokes((s) => [...s, d.stroke])
      else if (d.kind === 'clear') setStrokes([])
      else if (d.kind === 'init') setStrokes(d.strokes || [])
    })
    room.onCursor((c) => {
      setCursors((prev) => {
        if (c.off) {
          if (!prev[c.from]) return prev
          const next = { ...prev }
          delete next[c.from]
          return next
        }
        return { ...prev, [c.from]: { x: c.x, y: c.y, nickname: c.nickname, color: c.color, ts: Date.now() } }
      })
    })
    room.onChat((msg) => {
      setMessages((prev) => [...prev.slice(-199), msg])
      // 텍스트 메시지는 보낸 사람 머리 위 말풍선으로도 표시
      if (msg.type === 'text') {
        setBubbles((prev) => ({ ...prev, [msg.from]: { text: msg.text, ts: msg.ts } }))
      }
      // 채팅이 닫혀 있을 때 남이 보낸 메시지는 안 읽음으로 카운트
      if (!chatOpenRef.current && msg.type !== 'system' && msg.from !== me.id) {
        setUnread((u) => u + 1)
      }
    })

    return () => room.leave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, ROOM_ID])

  // 로비 디렉터리에 내 방 광고(주기적 beat). 방을 모두 나가면 beat가 끊겨 1분 뒤 목록에서 사라짐.
  useEffect(() => {
    if (ROOM_ID === 'main') return // 기본 방은 목록에 안 띄움
    const lobby = createLobby()
    const beat = () => lobby.beat({ roomId: ROOM_ID, name: roomName || ROOM_ID, count: peersRef.current.size + 1 })
    beat()
    const t = setInterval(beat, 4000)
    return () => { clearInterval(t); lobby.leave() }
  }, [ROOM_ID, roomName])

  // 오래된 말풍선/이모트 정리
  useEffect(() => {
    const prune = (life) => (prev) => {
      const now = Date.now()
      let changed = false
      const next = {}
      for (const [id, b] of Object.entries(prev)) {
        if (now - b.ts < life) next[id] = b
        else changed = true
      }
      return changed ? next : prev
    }
    const t = setInterval(() => {
      setBubbles(prune(5000))
      setEmotes(prune(4000))
      setCursors(prune(5000)) // 신호 끊긴 커서 정리
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // 커서 모드를 끄면 내 커서를 모두에게서 제거
  useEffect(() => {
    if (!cursorMode) { roomRef.current?.sendCursor({ from: me.id, off: true }); setMyCursor(null) }
  }, [cursorMode, me.id])

  // 자동 이동(클릭/탭 길찾기)
  const autoPathRef = useRef(null)
  const autoTimerRef = useRef(null)
  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null }
    autoPathRef.current = null
  }, [])
  useEffect(() => stopAuto, [stopAuto]) // 언마운트 정리

  // 한 칸 이동 (공용). 막혀 있으면 false.
  const stepTo = useCallback((row, col) => {
    const pl = PLACES[placeRef.current]
    if (row < 0 || col < 0 || row >= pl.ROWS || col >= pl.COLS) return false
    if (isWall(pl, row, col)) return false
    for (const p of peersRef.current.values()) {
      if (p.row === row && p.col === col) return false // 다른 참가자 칸 막기
    }
    const next = { row, col }
    setPos(next)
    roomRef.current?.updateState(next)
    return true
  }, [])

  // 키보드·D패드 이동 — 수동 이동은 자동 이동을 취소
  const moveBy = useCallback((dr, dc) => {
    if (Date.now() < stunUntilRef.current) return // 기절 중 이동 불가
    stopAuto()
    const cur = posRef.current
    stepTo(cur.row + dr, cur.col + dc)
  }, [stepTo, stopAuto])

  // 클릭/탭한 칸으로 자동 이동 (길찾기)
  const goTo = useCallback((row, col) => {
    if (Date.now() < stunUntilRef.current) return // 기절 중 이동 불가
    const pl = PLACES[placeRef.current]
    const target = nearestWalkable(pl, row, col)
    if (!target) return
    const path = bfsPath(pl, posRef.current, target)
    if (!path || !path.length) return
    autoPathRef.current = path
    if (autoTimerRef.current) return
    autoTimerRef.current = setInterval(() => {
      const p = autoPathRef.current
      if (!p || !p.length) { stopAuto(); return }
      const next = p[0]
      if (!stepTo(next.row, next.col)) { stopAuto(); return } // 막히면 중단
      p.shift()
      if (!p.length) stopAuto()
    }, 150)
  }, [stepTo, stopAuto])

  // 돌 던지기 — 현재 위치에서 클릭한 칸으로. 1초 쿨다운.
  const throwRock = useCallback((row, col) => {
    const now = Date.now()
    if (now - lastThrowRef.current < 1000) return // 쿨다운(1초에 한 번)
    const from = posRef.current
    if (from.row === row && from.col === col) return // 제자리엔 안 던짐
    lastThrowRef.current = now
    const dist = Math.hypot(row - from.row, col - from.col)
    const dur = Math.round(Math.min(700, Math.max(220, dist * 55)))
    roomRef.current?.sendRock({
      id: crypto.randomUUID?.() || String(Math.random()).slice(2),
      by: me.id,
      fromRow: from.row, fromCol: from.col,
      toRow: row, toCol: col,
      dur,
    }) // 로컬 echo + 전파 → onRock 에서 렌더/명중 판정
  }, [me.id])
  useEffect(() => { throwRockRef.current = throwRock }, [throwRock])

  // 스테이지 포인터: 탭→자동이동 / 드래그·마우스이동→커서 공유 (모바일은 내 커서도 표시)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let last = 0, down = null, dragged = false
    const toMap = (e) => {
      const rect = stage.getBoundingClientRect()
      const { x: cx, y: cy, scale } = camRef.current
      const x = (e.clientX - rect.left - cx) / scale
      const y = (e.clientY - rect.top - cy) / scale
      return { x, y, col: Math.floor(x / TILE), row: Math.floor(y / TILE) }
    }
    const onDown = (e) => {
      down = { x: e.clientX, y: e.clientY, t: Date.now() }
      dragged = false
      if (cursorModeRef.current && e.pointerType !== 'mouse') {
        const m = toMap(e); setMyCursor({ x: m.x, y: m.y })
      }
    }
    const onMove = (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) dragged = true
      if (!cursorModeRef.current) return
      if (e.pointerType !== 'mouse' && !down) return // 터치는 누른 채만
      const now = Date.now()
      if (now - last < 45) return
      last = now
      const m = toMap(e)
      roomRef.current?.sendCursor({ from: me.id, x: m.x, y: m.y, nickname: me.nickname, color: me.color })
      if (e.pointerType !== 'mouse') setMyCursor({ x: m.x, y: m.y })
    }
    // 탭 → 자동 이동 (드래그·스와이프는 dragged 로 제외). pointerup·click 둘 다에서
    // 시도(환경에 따라 click 미발생 가능). goTo 는 멱등이라 중복 호출돼도 안전.
    const navAt = (e) => {
      if (dragged) return
      if (e.target.closest && e.target.closest('.bigscreen, .whiteboard, button, .cursor')) return
      const m = toMap(e)
      if (rockModeRef.current) { throwRockRef.current?.(m.row, m.col); return } // 돌 던지기 모드
      goTo(m.row, m.col)
    }
    const onUp = (e) => {
      const wasTap = down && !dragged && Date.now() - down.t < 700
      down = null
      if (wasTap) navAt(e)
    }
    const onClick = (e) => navAt(e)
    const onLeave = (e) => {
      if (cursorModeRef.current && e.pointerType === 'mouse') roomRef.current?.sendCursor({ from: me.id, off: true })
    }
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointerleave', onLeave)
    stage.addEventListener('click', onClick)
    return () => {
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointerleave', onLeave)
      stage.removeEventListener('click', onClick)
    }
  }, [me.id, me.nickname, me.color, goTo])

  // 키보드 이동
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': moveBy(-1, 0); break
        case 'ArrowDown': case 's': case 'S': moveBy(1, 0); break
        case 'ArrowLeft': case 'a': case 'A': moveBy(0, -1); break
        case 'ArrowRight': case 'd': case 'D': moveBy(0, 1); break
        default: return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveBy])

  const zoom = useCallback((dir) => {
    setView('follow')
    setZoomIdx((i) => Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + dir)))
  }, [])

  const sendChat = useCallback((msg) => {
    roomRef.current?.sendChat(msg)
  }, [])

  // 대형 스크린에 사진 올리기 (broadcast 전달 한도 고려해 적당히 압축)
  const presentToScreen = useCallback(async () => {
    const picked = await pickImage(1100, 0.72)
    if (!picked) return
    iSetScreenRef.current = true
    roomRef.current?.setScreen({ photo: picked.dataUrl, by: me.nickname })
  }, [me.nickname])

  // 클립보드 이미지를 스크린에 올리기
  const putBlobOnScreen = useCallback(async (blob) => {
    const src = await toShareableSrc(blob, 1100, 0.72)
    iSetScreenRef.current = true
    roomRef.current?.setScreen({ photo: src, by: me.nickname })
  }, [me.nickname])

  // 붙여넣기 버튼 — 클립보드 읽기 API 사용
  const pasteToScreen = useCallback(async () => {
    try {
      if (!navigator.clipboard?.read) throw new Error('no-api')
      const items = await navigator.clipboard.read()
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith('image/'))
        if (type) { await putBlobOnScreen(await it.getType(type)); return }
      }
      alert('클립보드에 이미지가 없습니다. 사진을 복사한 뒤 다시 시도하거나, 스크린을 클릭하고 Ctrl+V 를 누르세요.')
    } catch {
      alert('붙여넣기 권한이 없으면 Ctrl+V 로 붙여넣어 보세요.')
    }
  }, [putBlobOnScreen])

  // 전역 Ctrl+V — 클립보드 이미지를 스크린에 (채팅 입력 등 어디서든)
  useEffect(() => {
    const onPaste = async (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const it of items) {
        if (it.kind === 'file' && it.type.startsWith('image/')) {
          const file = it.getAsFile()
          if (!file) continue
          e.preventDefault()
          await putBlobOnScreen(file)
          return
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [putBlobOnScreen])

  // 드래그앤드랍 — 이미지 파일을 사무실 어디든 끌어다 놓으면 스크린에
  const [dropActive, setDropActive] = useState(false)
  useEffect(() => {
    const hasImage = (dt) =>
      dt && Array.from(dt.types || []).includes('Files')
    const onDragOver = (e) => {
      if (!hasImage(e.dataTransfer)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDropActive(true)
    }
    const onDragLeave = (e) => {
      if (e.relatedTarget === null) setDropActive(false) // 창 밖으로 나감
    }
    const onDrop = async (e) => {
      const dt = e.dataTransfer
      if (!dt) return
      const file = Array.from(dt.files || []).find((f) => f.type.startsWith('image/'))
      setDropActive(false)
      if (!file) return
      e.preventDefault()
      await putBlobOnScreen(file)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [putBlobOnScreen])

  // 공유 화면 끄기 (null 대신 빈 객체로 — null 페이로드는 broadcast 전달이 안 됨)
  const clearScreen = useCallback(() => {
    iSetScreenRef.current = false
    roomRef.current?.setScreen({ photo: null })
  }, [])

  // 화이트보드 저장
  const saveBoard = useCallback((idx, text) => {
    roomRef.current?.setBoard({ idx, text })
  }, [])

  // 감정표현(이모트) 전송
  const sendEmote = useCallback((emoji) => {
    roomRef.current?.sendEmote({ from: me.id, emoji })
    setShowEmotes(false)
  }, [me.id])

  // 확성기 — 전체에게 전광판으로 전송
  const sendAnnounce = useCallback((text) => {
    const t = text.trim()
    if (!t) return
    roomRef.current?.sendAnnounce({ text: t.slice(0, 120), by: me.nickname, ts: Date.now() })
    setShowMega(false)
  }, [me.nickname])

  // 전광판은 9초 후 사라짐
  useEffect(() => {
    if (!announce) return
    const t = setTimeout(() => setAnnounce(null), 9000)
    return () => clearTimeout(t)
  }, [announce])

  // 스크린 낙서
  const addStroke = useCallback((stroke) => {
    setStrokes((s) => [...s, stroke])
    roomRef.current?.sendDraw({ kind: 'add', stroke })
  }, [])
  const clearStrokes = useCallback(() => {
    setStrokes([])
    roomRef.current?.sendDraw({ kind: 'clear' })
  }, [])

  // 장소 이동 (모두 함께) — broadcast 후 onPlace가 전환 처리
  const goPlace = useCallback((p) => {
    if (p !== placeRef.current) roomRef.current?.setPlace(p)
  }, [])

  return (
    <div className={'office' + (chatOpen ? ' chat-open' : '') + (chatOpen && chatMin ? ' chat-min' : '') + (rockMode ? ' rock-aim' : '')}>
      {showNotice && <WelcomeNotice me={me} onClose={() => setShowNotice(false)} />}

      <header className="topbar">
        <span className="logo">🏢 ADX Town</span>
        <span className="places">
          {PLACE_LIST.map((pl) => (
            <button
              key={pl.key}
              className={'place-btn' + (place === pl.key ? ' on' : '')}
              onClick={() => goPlace(pl.key)}
            >
              {pl.label}
            </button>
          ))}
        </span>
        <span className="count">접속 {peers.size + 1}명</span>
        <span className="zoom-ctrl">
          <button onClick={() => zoom(-1)} disabled={view === 'follow' && zoomIdx === 0} aria-label="축소">−</button>
          <button onClick={() => zoom(1)} disabled={view === 'follow' && zoomIdx === ZOOM_STEPS.length - 1} aria-label="확대">＋</button>
        </span>
        <button className="invite-btn" onClick={shareLink} title="초대 링크 복사">
          {shareCopied ? '✅ 복사됨' : '🔗 초대'}
        </button>
        <button className="notice-btn" onClick={() => setShowNotice(true)}>📢 공지</button>
        <button className="leave-btn" onClick={onLeave}>나가기</button>
      </header>

      {announce && (
        <div className="announce-bar">
          <div className="announce-track" key={announce.shownAt}>
            📢 <b>{announce.by}</b> &nbsp;·&nbsp; {announce.text}
          </div>
        </div>
      )}

      {/* 좌측 상단 세로 플로팅 도구 (아이콘 + 라벨) */}
      <div className="tool-dock">
        <button className={'tool' + (voiceOn ? ' on' : '')} onClick={toggleVoice} title="근접 음성 (3칸 이내)">
          <span className="tool-icon">🎙️</span><span className="tool-label">음성대화</span>
        </button>
        <button className={'tool' + (showMega ? ' on' : '')} onClick={() => setShowMega((s) => !s)} title="확성기 — 전체 공지">
          <span className="tool-icon">📣</span><span className="tool-label">확성기</span>
        </button>
        <button className={'tool' + (cursorMode ? ' on' : '')} onClick={() => setCursorMode((c) => !c)} title="커서 공유">
          <span className="tool-icon">🖱️</span><span className="tool-label">커서공유</span>
        </button>
        <button className={'tool' + (botOn ? ' on' : '')} onClick={toggleBot} title="자비스 호출">
          <span className="tool-icon">🤖</span><span className="tool-label">자비스</span>
        </button>
        <button className={'tool' + (rockMode ? ' on' : '')} onClick={() => setRockMode((r) => !r)} title="돌 던지기 — 클릭한 곳에 던져 1초 기절 (1초 쿨다운)">
          <span className="tool-icon">🪨</span><span className="tool-label">돌던지기</span>
        </button>
        <button
          className={'tool' + (view === 'overview' ? ' on' : '')}
          onClick={() => setView((v) => (v === 'follow' ? 'overview' : 'follow'))}
          title={view === 'follow' ? '전체 보기' : '따라가기'}
        >
          <span className="tool-icon">{view === 'follow' ? '🗺️' : '🔍'}</span>
          <span className="tool-label">{view === 'follow' ? '전체보기' : '따라가기'}</span>
        </button>
      </div>

      {showMega && <Megaphone onSend={sendAnnounce} onClose={() => setShowMega(false)} />}

      {dropActive && (
        <div className="drop-overlay">
          <div className="drop-card">🖼️ 놓으면 스크린에 공유돼요</div>
        </div>
      )}

      <div className="workspace">
        <div className="stage" ref={stageRef}>
          <div
            className="map"
            style={{
              width: P.COLS * TILE,
              height: P.ROWS * TILE,
              transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            }}
          >
            <MapFloor place={P} />
            <ZoneLabels zones={P.ZONES} />
            {P.BOARDS.map((b) => (
              <Whiteboard key={b.idx} board={b} text={boards[b.idx] || ''} onSave={saveBoard} />
            ))}
            <LargeScreen
              rect={P.SCREEN}
              screen={screen}
              strokes={strokes}
              onUpload={presentToScreen}
              onPaste={pasteToScreen}
              onClear={clearScreen}
              onEnlarge={() => screen?.photo && setScreenPreview(true)}
              onAddStroke={addStroke}
              onClearDraw={clearStrokes}
            />
            <Avatar state={{ ...me, ...pos }} isMe bubble={bubbles[me.id]?.text} emote={emotes[me.id]} voice={voiceOn} level={voiceOn ? levels.self : 0} stunned={!!stunned[me.id]} />
            {[...peers.entries()].map(([id, p]) => (
              <Avatar key={id} state={p} bubble={bubbles[id]?.text} emote={emotes[id]} voice={voicePeers.has(id)} level={levels.peers[id] || 0} stunned={!!stunned[id]} />
            ))}
            {rocks.map((r) => <Rock key={r.id} rock={r} />)}
            {[...peers.entries()].map(([id, p]) =>
              p.botVisible && p.row != null ? (
                <AiBot
                  key={id + '-bot'}
                  row={p.row}
                  col={p.col + 1 < P.COLS ? p.col + 1 : p.col - 1}
                  bubble={p.botSay?.text}
                />
              ) : null,
            )}
            {Object.entries(cursors).map(([id, c]) =>
              peers.has(id) ? <Cursor key={id} c={c} /> : null,
            )}
            {myCursor && <Cursor c={{ ...myCursor, nickname: me.nickname, color: me.color }} />}
            {(botOn || botExiting) && (
              <AiBot
                row={pos.row}
                col={pos.col + 1 < P.COLS ? pos.col + 1 : pos.col - 1}
                bubble={botBubble?.text}
                exiting={botExiting}
              />
            )}
          </div>
          <EmoteBar onPick={sendEmote} />
        </div>

        <Chat
          me={me}
          messages={messages}
          onSend={sendChat}
          open={chatOpen}
          minimized={chatMin}
          onClose={closeChat}
          onToggleMin={() => setChatMin((m) => !m)}
          onEmote={() => setShowEmotes((s) => !s)}
        />
      </div>

      {screenPreview && screen?.photo && (
        <ScreenLightbox
          photo={screen.photo}
          strokes={strokes}
          rect={P.SCREEN}
          onClose={() => setScreenPreview(false)}
        />
      )}

      {showEmotes && <EmotePicker onPick={sendEmote} onClose={() => setShowEmotes(false)} />}

      {(botOn || botExiting) && (
        <AiPanel
          messages={botMsgs}
          busy={botBusy}
          onAsk={askBot}
          onClose={closeBot}
          exiting={botExiting}
          shared={botShared}
          onToggleShare={toggleShare}
        />
      )}

      {!chatOpen && (
        <>
          <button className="chat-fab" onClick={openChat} aria-label="채팅 열기">
            💬
            {unread > 0 && <span className="chat-badge">{unread > 99 ? '99+' : unread}</span>}
          </button>
          <button className="emote-fab" onClick={() => setShowEmotes((s) => !s)} aria-label="감정표현">
            😄
          </button>
        </>
      )}

      <DPad onMove={moveBy} />

      <p className="hint">방향키·WASD(또는 화면 버튼) 이동 · 📺 스크린 클릭해서 사진 공유</p>
    </div>
  )
}
