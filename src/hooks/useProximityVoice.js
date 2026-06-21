import { useCallback, useEffect, useRef, useState } from 'react'
import { createVoiceChat } from '../lib/voice'

const VOICE_RANGE = 3 // 음성 연결 거리(칸, 체비셰프)

// 근접 음성: 3칸 이내 사람과 자동 연결/해제 + 음량 게이지.
// 시그널링은 room.sendRtc / room.onRtc 로 (Office 가 onRtc 에 handleSignal 을 연결).
export function useProximityVoice({ roomRef, me, pos, peers }) {
  const [voiceOn, setVoiceOn] = useState(false)
  const [voicePeers, setVoicePeers] = useState(new Set()) // 연결된(시도중) peer id
  const [levels, setLevels] = useState({ self: 0, peers: {} }) // 마이크 음량

  // 음성 인스턴스는 한 번만 생성 (lazy). 시그널 송신은 최신 room 참조.
  const voiceRef = useRef(null)
  if (!voiceRef.current) {
    const voice = createVoiceChat({
      myId: me.id,
      sendSignal: (payload) => roomRef.current?.sendRtc(payload),
    })
    voice.onChange(() => setVoicePeers(voice.activeIds()))
    voiceRef.current = voice
  }

  // 언마운트 시 정리
  useEffect(() => () => voiceRef.current?.disable(), [])

  // 근접 판정 → 연결/해제
  useEffect(() => {
    if (!voiceOn) return
    const near = new Set()
    for (const [id, p] of peers) {
      if (p.row == null) continue
      if (Math.max(Math.abs(p.row - pos.row), Math.abs(p.col - pos.col)) <= VOICE_RANGE) near.add(id)
    }
    voiceRef.current?.setNearby(near)
  }, [pos, peers, voiceOn])

  // 음량 폴링 (말하는지 게이지)
  useEffect(() => {
    if (!voiceOn) { setLevels({ self: 0, peers: {} }); return }
    const t = setInterval(() => {
      const l = voiceRef.current?.getLevels()
      if (l) setLevels(l)
    }, 80)
    return () => clearInterval(t)
  }, [voiceOn])

  const toggleVoice = useCallback(async () => {
    const v = voiceRef.current
    if (!v) return
    if (v.isEnabled()) {
      v.disable()
      setVoiceOn(false)
    } else {
      try {
        await v.enable()
        setVoiceOn(true)
      } catch {
        alert('마이크 사용 권한이 필요합니다. 브라우저에서 허용해 주세요.')
      }
    }
  }, [])

  const handleSignal = useCallback((p) => voiceRef.current?.handleSignal(p), [])

  return { voiceOn, voicePeers, levels, toggleVoice, handleSignal }
}
