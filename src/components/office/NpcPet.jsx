import { useEffect, useRef, useState } from 'react'
import { TILE } from '../../constants'

const CATS = ['🐱', '🐈', '🐈‍⬛', '🐱']
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

// 펫파크 고양이 NPC — 영역 안을 랜덤 배회 + 주기적 "야옹~" + 클릭하면 쓰다듬기(하트).
export default function NpcPets({ pets }) {
  const region = pets
  const [cats, setCats] = useState(() =>
    Array.from({ length: pets.count }, (_, i) => ({
      id: i,
      face: CATS[i % CATS.length],
      row: rnd(region.r0, region.r1),
      col: rnd(region.c0, region.c1),
      say: false,
      heart: 0,
      flip: false,
    })),
  )
  const timers = useRef([])

  useEffect(() => {
    // 배회
    const walk = setInterval(() => {
      setCats((prev) =>
        prev.map((c) => {
          const dr = rnd(-1, 1), dc = rnd(-1, 1)
          const row = Math.max(region.r0, Math.min(region.r1, c.row + dr))
          const col = Math.max(region.c0, Math.min(region.c1, c.col + dc))
          return { ...c, row, col, flip: dc < 0 ? true : dc > 0 ? false : c.flip }
        }),
      )
    }, 1600)
    // 가끔 야옹
    const meow = setInterval(() => {
      setCats((prev) => {
        const i = rnd(0, prev.length - 1)
        return prev.map((c, idx) => (idx === i ? { ...c, say: Date.now() } : c))
      })
      setTimeout(() => setCats((prev) => prev.map((c) => ({ ...c, say: false }))), 1800)
    }, 4200)
    timers.current = [walk, meow]
    return () => timers.current.forEach(clearInterval)
  }, [region.r0, region.r1, region.c0, region.c1])

  const pet = (id) =>
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, heart: Date.now() } : c)))

  return (
    <>
      {cats.map((c) => (
        <div
          key={c.id}
          className="npc-cat"
          style={{ left: c.col * TILE, top: c.row * TILE, width: TILE, height: TILE }}
          onClick={() => pet(c.id)}
          title="쓰다듬기"
        >
          {c.say && <div className="npc-say">야옹~</div>}
          {c.heart ? <div className="npc-heart" key={c.heart}>💕</div> : null}
          <span className={'npc-face' + (c.flip ? ' flip' : '')}>{c.face}</span>
        </div>
      ))}
    </>
  )
}
