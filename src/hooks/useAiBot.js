import { useCallback, useEffect, useRef, useState } from 'react'
import { askGroq } from '../lib/ai'

const GREET = '안녕하세요, 저는 자비스입니다. 무엇이든 물어보세요. 🤖'

// 자비스(AI 봇): 호출/해제(애니메이션), 질의응답(채팅 이력 컨텍스트), 말풍선, 공유 broadcast.
// roomRef: 실시간 방, messagesRef: 사무실 채팅 메시지 ref(맥락용).
export function useAiBot({ roomRef, messagesRef }) {
  const [botOn, setBotOn] = useState(false)
  const [botExiting, setBotExiting] = useState(false)
  const [botMsgs, setBotMsgs] = useState([]) // [{ role, text }]
  const [botBusy, setBotBusy] = useState(false)
  const [botBubble, setBotBubble] = useState(null) // { text, ts }
  const [botShared, setBotShared] = useState(false) // 남에게도 보이기
  const botMsgsRef = useRef(botMsgs)
  botMsgsRef.current = botMsgs
  const botOnRef = useRef(botOn)
  botOnRef.current = botOn

  const openBot = useCallback(() => {
    if (botMsgsRef.current.length === 0) {
      setBotMsgs([{ role: 'assistant', text: GREET }])
      setBotBubble({ text: GREET, ts: Date.now() })
    }
    setBotExiting(false)
    setBotOn(true)
  }, [])
  const closeBot = useCallback(() => {
    setBotExiting(true)
    setBotBubble(null)
    setTimeout(() => { setBotOn(false); setBotExiting(false) }, 420)
  }, [])
  const toggleBot = useCallback(() => {
    botOnRef.current ? closeBot() : openBot()
  }, [openBot, closeBot])
  const toggleShare = useCallback(() => setBotShared((s) => !s), [])

  // 질문 — 사무실 채팅 이력을 맥락으로 함께 전달
  const askBot = useCallback(async (text) => {
    const history = [...botMsgsRef.current, { role: 'user', text }]
    setBotMsgs(history)
    setBotBusy(true)
    const chatContext = (messagesRef.current || [])
      .slice(-60)
      .map((m) => {
        if (m.type === 'system') return `(${m.text})`
        if (m.type === 'photo') return `${m.sender}: [사진 공유]`
        return `${m.sender}: ${m.text}`
      })
      .join('\n')
    try {
      const answer = await askGroq(history, chatContext)
      setBotMsgs((m) => [...m, { role: 'assistant', text: answer }])
      setBotBubble({ text: answer, ts: Date.now() })
    } catch (e) {
      const err = '⚠️ ' + (e?.message || '문제가 생겼어요.')
      setBotMsgs((m) => [...m, { role: 'assistant', text: err }])
      setBotBubble({ text: err, ts: Date.now() })
    } finally {
      setBotBusy(false)
    }
  }, [messagesRef])

  // 말풍선 10초 후 사라짐
  useEffect(() => {
    if (!botBubble) return
    const t = setTimeout(() => setBotBubble(null), 10000)
    return () => clearTimeout(t)
  }, [botBubble])

  // 공유: 내 자비스 표시 여부/말풍선을 내 상태에 실어 broadcast (남이 내 옆에 렌더링)
  useEffect(() => {
    roomRef.current?.updateState({ botVisible: botOn && botShared })
  }, [botOn, botShared, roomRef])
  useEffect(() => {
    if (!botShared) return
    roomRef.current?.updateState({
      botSay: botBubble ? { text: botBubble.text.slice(0, 160), ts: botBubble.ts } : null,
    })
  }, [botBubble, botShared, roomRef])

  return {
    botOn, botExiting, botMsgs, botBusy, botBubble, botShared,
    toggleBot, closeBot, askBot, toggleShare,
  }
}
