// 근접 음성 채팅 (WebRTC) — 가까운 사람끼리 P2P 오디오 연결.
// 시그널링(offer/answer/ICE)은 외부에서 주입한 sendSignal/handleSignal 로 주고받는다.
// ICE 서버(STUN/TURN)는 config 에서 — TURN 은 .env 로 설정 가능.

import { ICE_SERVERS } from './config'

const ICE = { iceServers: ICE_SERVERS }

export function createVoiceChat({ myId, sendSignal }) {
  let localStream = null
  let enabled = false
  let onChange = () => {}
  const pcs = new Map() // peerId -> { pc, audioEl, analyser, src }
  let nearby = new Set()
  let audioCtx = null
  let localAnalyser = null

  // 스트림에서 음량 분석용 analyser 생성
  function analyserFor(stream) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const src = audioCtx.createMediaStreamSource(stream)
    const an = audioCtx.createAnalyser()
    an.fftSize = 256
    src.connect(an) // destination 에는 연결 안 함(출력은 audio 엘리먼트가 담당)
    return { an, src }
  }
  function levelOf(an) {
    if (!an) return 0
    const buf = new Uint8Array(an.fftSize)
    an.getByteTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) {
      const x = (buf[i] - 128) / 128
      sum += x * x
    }
    return Math.min(1, Math.sqrt(sum / buf.length) * 2.5)
  }

  async function enable() {
    if (enabled) return
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    const la = analyserFor(localStream)
    localAnalyser = la.an
    if (audioCtx && audioCtx.state === 'suspended') { try { await audioCtx.resume() } catch {} }
    enabled = true
    // 내가 음성을 켰음을 알림 → 가까운(켜진) 사람들이 핸드셰이크 시작
    sendSignal({ type: 'ready', from: myId })
    for (const id of nearby) kick(id)
    onChange()
  }

  // 상대와 연결을 시작(또는 발신자에게 시작 요청)
  function kick(id) {
    if (!enabled || pcs.has(id)) return
    if (myId < id) initiate(id) // 작은 id가 발신자
    else sendSignal({ type: 'ready', from: myId, to: id }) // 발신자에게 "준비됐다" 알림
  }
  function handleReady(from) {
    if (!enabled || !nearby.has(from) || pcs.has(from)) return
    if (myId < from) initiate(from)
    else sendSignal({ type: 'ready', from: myId, to: from })
  }

  function disable() {
    enabled = false
    nearby = new Set()
    for (const id of [...pcs.keys()]) teardown(id)
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop())
      localStream = null
    }
    localAnalyser = null
    onChange()
  }

  function teardown(id) {
    const e = pcs.get(id)
    if (!e) return
    try { e.pc.close() } catch {}
    try { e.src && e.src.disconnect() } catch {}
    if (e.audioEl) { e.audioEl.srcObject = null; e.audioEl.remove() }
    pcs.delete(id)
    onChange()
  }

  function makePc(id) {
    const pc = new RTCPeerConnection(ICE)
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream))
    const audioEl = document.createElement('audio')
    audioEl.autoplay = true
    audioEl.dataset.voice = id
    document.body.appendChild(audioEl)
    pc.ontrack = (ev) => {
      audioEl.srcObject = ev.streams[0]
      const a = analyserFor(ev.streams[0])
      entry.analyser = a.an
      entry.src = a.src
    }
    pc.onicecandidate = (ev) => {
      if (ev.candidate) sendSignal({ type: 'ice', to: id, from: myId, candidate: ev.candidate })
    }
    pc.onconnectionstatechange = () => onChange()
    const entry = { pc, audioEl }
    pcs.set(id, entry)
    return entry
  }

  async function initiate(id) {
    if (pcs.has(id)) return
    const { pc } = makePc(id)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignal({ type: 'offer', to: id, from: myId, sdp: pc.localDescription })
    onChange()
  }

  async function handleSignal(p) {
    if (!enabled || !p) return
    if (p.type === 'ready') {
      if (p.to && p.to !== myId) return
      handleReady(p.from)
      return
    }
    if (p.to !== myId) return
    try {
      if (p.type === 'offer') {
        const entry = pcs.get(p.from) || makePc(p.from)
        await entry.pc.setRemoteDescription(p.sdp)
        const answer = await entry.pc.createAnswer()
        await entry.pc.setLocalDescription(answer)
        sendSignal({ type: 'answer', to: p.from, from: myId, sdp: entry.pc.localDescription })
        onChange()
      } else if (p.type === 'answer') {
        const entry = pcs.get(p.from)
        if (entry) await entry.pc.setRemoteDescription(p.sdp)
      } else if (p.type === 'ice') {
        const entry = pcs.get(p.from)
        if (entry && p.candidate) await entry.pc.addIceCandidate(p.candidate)
      }
    } catch (err) {
      // ICE/SDP 경합은 무시 (재시도 경로로 복구)
    }
  }

  // 현재 가까운 사람 집합으로 연결/해제 동기화.
  function setNearby(idSet) {
    nearby = new Set(idSet)
    // 범위 벗어난 연결 해제
    for (const id of [...pcs.keys()]) {
      if (!nearby.has(id)) teardown(id)
    }
    if (!enabled) return
    // 새로 가까워진 사람과 핸드셰이크 시작
    for (const id of nearby) kick(id)
  }

  return {
    enable,
    disable,
    handleSignal,
    setNearby,
    isEnabled: () => enabled,
    activeIds: () => new Set(pcs.keys()),
    connectedIds: () =>
      new Set([...pcs.entries()].filter(([, e]) => e.pc.connectionState === 'connected').map(([id]) => id)),
    // 마이크 음량 (0~1): 내 것 + 연결된 상대들
    getLevels: () => {
      const peers = {}
      for (const [id, e] of pcs) peers[id] = levelOf(e.analyser)
      return { self: enabled ? levelOf(localAnalyser) : 0, peers }
    },
    onChange: (cb) => { onChange = cb },
  }
}
