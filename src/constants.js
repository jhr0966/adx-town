// 맵 / 아바타 공통 설정 — 여러 장소(PLACES) 지원
//
// 각 장소는 { COLS, ROWS, tiles, START, SCREEN, ZONES, BOARDS } 를 가진다.
// 장소 이동 시 모두 함께 이동한다.

export const TILE = 34

// ── 장소 빌더 헬퍼 ──
function makeGrid(cols, rows) {
  const tiles = {}
  const api = {
    cols,
    rows,
    tiles,
    set(r, c, t) {
      if (r >= 0 && c >= 0 && r < rows && c < cols) tiles[`${r},${c}`] = t
    },
    rect(r0, c0, r1, c1, t) {
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) api.set(r, c, t)
    },
  }
  return api
}

// ── 1) 사무실 ──
function buildOffice() {
  const COLS = 40, ROWS = 22
  const g = makeGrid(COLS, ROWS)
  g.rect(0, 0, ROWS - 1, COLS - 1, 'floor')
  g.rect(4, 0, ROWS - 1, 10, 'rest')
  g.rect(0, 11, ROWS - 1, 12, 'corridor')

  const GROUPS = [
    { a: 13, b: 18, name: '생산지능화', mgr: '그룹장석' },
    { a: 20, b: 25, name: '생산자동화', mgr: '그룹장석' },
    { a: 27, b: 32, name: '생산디지털', mgr: '그룹장석' },
    { a: 34, b: 39, name: '생산ADX 직속', mgr: '리더석' },
  ]
  for (const grp of GROUPS) g.rect(4, grp.a, ROWS - 1, grp.b, 'grouparea')
  for (const pc of [19, 26, 33]) g.rect(4, pc, ROWS - 1, pc, 'partition')

  const managerSeat = (c0, c1) => {
    for (let c = c0; c <= c1; c++) { g.set(1, c, 'mgrdesk'); g.set(2, c, 'chair') }
  }
  managerSeat(0, 1)
  for (const grp of GROUPS) managerSeat(grp.a + 2, grp.a + 3)

  g.rect(1, 3, 2, 8, 'mtable')
  for (let c = 3; c <= 8; c++) g.set(3, c, 'chair')

  const DESK_ROWS = [6, 8, 10, 13, 15, 17]
  for (const grp of GROUPS) {
    for (const r of DESK_ROWS) {
      g.set(r, grp.a + 1, 'deskpc'); g.set(r, grp.a + 2, 'chair')
      g.set(r, grp.a + 4, 'deskpc'); g.set(r, grp.a + 3, 'chair')
    }
  }

  const BOARDS = GROUPS.map((grp, i) => ({ idx: i, row: 19, col: grp.a + 1, w: 4, h: 2 }))
  for (const b of BOARDS) g.rect(b.row, b.col, b.row + b.h - 1, b.col + b.w - 1, 'board')

  for (const r of [12, 15, 18]) for (const c of [3, 7]) g.set(r, c, 'rtable')
  for (const [r, c] of [[4, 1], [4, 9], [20, 1], [20, 9]]) g.set(r, c, 'plant')

  const SCREEN = { row: 5, col: 1, w: 9, h: 5 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')

  const ZONES = [
    { text: '생산ADX팀\n팀장석', row: 0, col: 0 },
    { text: '팀장 회의석', row: 0, col: 4.5 },
    { text: '휴식공간', row: 10.5, col: 3.5, big: true },
    { text: '통로', row: 13, col: 11 },
    ...GROUPS.flatMap((grp) => [
      { text: `${grp.name}\n${grp.mgr}`, row: 0, col: grp.a + 1.5 },
      { text: `${grp.name}\n그룹원석`, row: 4.4, col: grp.a + 1.5 },
    ]),
  ]

  return { COLS, ROWS, tiles: g.tiles, START: { row: 16, col: 11 }, SCREEN, ZONES, BOARDS }
}

// ── 2) 대회의실 ── 중앙 대형 스크린 + 둘러앉는 좌석
function buildConference() {
  const COLS = 30, ROWS = 20
  const g = makeGrid(COLS, ROWS)
  g.rect(0, 0, ROWS - 1, COLS - 1, 'conffloor')
  // 테두리 벽
  for (let c = 0; c < COLS; c++) { g.set(0, c, 'wall'); g.set(ROWS - 1, c, 'wall') }
  for (let r = 0; r < ROWS; r++) { g.set(r, 0, 'wall'); g.set(r, COLS - 1, 'wall') }

  // 중앙 대형 스크린 (크게, 16:9)
  const SCREEN = { row: 6, col: 9, w: 12, h: 7 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')

  // 스크린을 둘러싼 좌석(의자=안쪽, 책상=바깥쪽)
  // 위
  for (let c = 9; c <= 20; c++) { g.set(4, c, 'chair'); g.set(3, c, 'deskpc') }
  // 아래
  for (let c = 9; c <= 20; c++) { g.set(15, c, 'chair'); g.set(16, c, 'deskpc') }
  // 왼쪽
  for (let r = 6; r <= 13; r++) { g.set(r, 7, 'chair'); g.set(r, 6, 'deskpc') }
  // 오른쪽
  for (let r = 6; r <= 13; r++) { g.set(r, 22, 'chair'); g.set(r, 23, 'deskpc') }

  // 장식
  for (const [r, c] of [[2, 2], [2, COLS - 3], [ROWS - 3, 2], [ROWS - 3, COLS - 3]]) g.set(r, c, 'plant')

  const ZONES = [
    { text: '🎤 대회의실', row: 1, col: 12, big: true },
  ]

  return { COLS, ROWS, tiles: g.tiles, START: { row: 18, col: 14 }, SCREEN, ZONES, BOARDS: [] }
}

export const PLACES = {
  office: buildOffice(),
  conference: buildConference(),
}
export const PLACE_LIST = [
  { key: 'office', label: '🏢 사무실' },
  { key: 'conference', label: '🎤 대회의실' },
]

const BLOCKING = new Set([
  'wall', 'partition', 'deskpc', 'mgrdesk', 'mtable', 'rtable', 'board', 'screen', 'plant',
])

export function tileType(place, row, col) {
  return place.tiles[`${row},${col}`] || 'floor'
}
export function isWall(place, row, col) {
  return BLOCKING.has(tileType(place, row, col))
}

// 선택 가능한 아바타 (이모지)
export const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🐰', '🐸', '🐵', '🦁', '🐯', '🐨', '🐧', '🦄']

// 닉네임 라벨 색상 후보
export const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
]
