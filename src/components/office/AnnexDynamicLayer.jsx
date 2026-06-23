import { memo } from 'react'
import { Decorations } from './Decorations'
import NpcPets from './NpcPet'

// 별관 동적 레이어 — 현재 층의 분위기 파티클(김/불씨/별/반짝임) + 고양이 NPC.
// 불꽃·러닝머신 벨트·네온·물결 등은 타일 CSS 애니메이션으로 처리한다.
export const AnnexDynamicLayer = memo(function AnnexDynamicLayer({ place }) {
  if (!place) return null
  return (
    <>
      <Decorations decor={place.DECOR} />
      {place.PETS && <NpcPets pets={place.PETS} />}
    </>
  )
})
