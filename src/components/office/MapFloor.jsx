import { memo } from 'react'
import { TILE, tileType } from '../../constants'

// 타입별 타일 표시 정보 (icon은 가구 위에 얹는 표시)
const TILE_VIEW = {
  floor: { cls: 'floor', icon: '' },
  rest: { cls: 'rest', icon: '' },
  corridor: { cls: 'corridor', icon: '' },
  grouparea: { cls: 'grouparea', icon: '' },
  partition: { cls: 'partition', icon: '' },
  deskpc: { cls: 'deskpc', icon: '🖥️' },
  mgrdesk: { cls: 'mgrdesk', icon: '🖥️' },
  chair: { cls: 'chair', icon: '🪑' },
  mtable: { cls: 'mtable', icon: '' },
  rtable: { cls: 'rtable', icon: '☕' },
  board: { cls: 'board', icon: '' },
  plant: { cls: 'plant', icon: '🪴' },
  screen: { cls: 'screen', icon: '' },
  wall: { cls: 'wall', icon: '' },
  // ── 별관(別館) 타일 ──
  annexFloor: { cls: 'annexFloor', icon: '' },
  deck: { cls: 'deck', icon: '' },
  onsenrock: { cls: 'onsenrock', icon: '' },
  spaWater: { cls: 'spaWater', icon: '' },
  saunaMat: { cls: 'saunaMat', icon: '' },
  lantern: { cls: 'lantern', icon: '🏮' },
  cafeCounter: { cls: 'cafeCounter', icon: '☕' },
  foodTable: { cls: 'foodTable', icon: '🍽️' },
  pochaTent: { cls: 'pochaTent', icon: '🏮' },
  arcade: { cls: 'arcade', icon: '🕹️' },
  pool: { cls: 'pool', icon: '🎱' },
  sofa: { cls: 'sofa', icon: '' },
  shelf: { cls: 'shelf', icon: '📚' },
  escapeWall: { cls: 'escapeWall', icon: '' },
  keypad: { cls: 'keypad', icon: '🔢' },
  treadmill: { cls: 'treadmill', icon: '🏃' },
  bike: { cls: 'bike', icon: '🚴' },
  bench: { cls: 'bench', icon: '🏋️' },
  dumbbell: { cls: 'dumbbell', icon: '💪' },
  yoga: { cls: 'yoga', icon: '🧘' },
  grass: { cls: 'grass', icon: '' },
  catTower: { cls: 'catTower', icon: '🐈' },
  petToy: { cls: 'petToy', icon: '🧶' },
  napRoom: { cls: 'napRoom', icon: '' },
  napBed: { cls: 'napBed', icon: '🛏️' },
  campfire: { cls: 'campfire', icon: '' },
  tent: { cls: 'tent', icon: '⛺' },
  campChair: { cls: 'campChair', icon: '🪑' },
  barCounter: { cls: 'barCounter', icon: '🍸' },
  barstool: { cls: 'barstool', icon: '🪑' },
  skyline: { cls: 'skyline', icon: '' },
  rug: { cls: 'rug', icon: '' },
  fountain: { cls: 'fountain', icon: '⛲' },
  stairUp: { cls: 'stairUp', icon: '🔼' },
  stairDown: { cls: 'stairDown', icon: '🔽' },
}

// 바닥/가구 타일. place 가 바뀔 때만 다시 그린다(메모).
export const MapFloor = memo(function MapFloor({ place }) {
  const tiles = []
  for (let r = 0; r < place.ROWS; r++) {
    for (let c = 0; c < place.COLS; c++) {
      const view = TILE_VIEW[tileType(place, r, c)] || TILE_VIEW.floor
      tiles.push(
        <div
          key={`${r},${c}`}
          className={'tile ' + view.cls}
          style={{ left: c * TILE, top: r * TILE, width: TILE, height: TILE }}
        >
          {view.icon && <span className="tile-icon">{view.icon}</span>}
        </div>,
      )
    }
  }
  return <>{tiles}</>
})

export const ZoneLabels = memo(function ZoneLabels({ zones }) {
  return (
    <>
      {zones.map((z, i) => (
        <div
          key={i}
          className={'zone-label' + (z.big ? ' big' : '') + (z.small ? ' small' : '')}
          style={{ left: z.col * TILE, top: z.row * TILE }}
        >
          {z.text}
        </div>
      ))}
    </>
  )
})
