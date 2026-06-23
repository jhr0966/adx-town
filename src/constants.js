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

// ── 3) 별관(別館) ── 온천·게임존·휴게실·카페바를 십자 복도로 잇는 넓은 휴식 공간
function buildAnnex() {
  const COLS = 48, ROWS = 30
  const g = makeGrid(COLS, ROWS)
  g.rect(0, 0, ROWS - 1, COLS - 1, 'annexfloor')
  // 테두리 벽
  for (let c = 0; c < COLS; c++) { g.set(0, c, 'wall'); g.set(ROWS - 1, c, 'wall') }
  for (let r = 0; r < ROWS; r++) { g.set(r, 0, 'wall'); g.set(r, COLS - 1, 'wall') }
  // 십자(十) 복도 — 네 구역을 잇는 통로
  g.rect(14, 1, 15, COLS - 2, 'corridor')
  g.rect(1, 23, ROWS - 2, 24, 'corridor')

  // ── ♨️ 온천 (좌상) — 나무 데크 + 바위 테두리 + 물 + 청사초롱 ──
  g.rect(3, 3, 12, 16, 'deck')
  g.rect(4, 4, 11, 15, 'onsenrock')
  g.rect(5, 5, 10, 14, 'water')
  for (const [r, c] of [[3, 3], [3, 16], [12, 3], [12, 16]]) g.set(r, c, 'lantern')
  g.set(7, 18, 'plant'); g.set(10, 18, 'plant')

  // ── 🎮 게임존 (우상) — 아케이드 + 당구대 + 대형 TV ──
  for (const c of [27, 29, 31, 33]) g.set(3, c, 'arcade')
  g.rect(7, 28, 8, 32, 'pool')
  for (const c of [28, 30, 32]) g.set(10, c, 'barstool')
  g.rect(11, 27, 12, 35, 'rug')
  g.set(6, 45, 'plant'); g.set(12, 45, 'plant')
  const SCREEN = { row: 1, col: 38, w: 8, h: 4 } // 대형 TV(스크린 공유)

  // ── 🛋️ 휴게실 (좌하) — ㄷ자 소파 + 러그 + 책장 ──
  for (let c = 4; c <= 9; c++) g.set(16, c, 'shelf')
  g.rect(18, 3, 26, 18, 'rug')
  for (let c = 5; c <= 14; c++) g.set(19, c, 'sofa')
  for (let r = 20; r <= 24; r++) { g.set(r, 5, 'sofa'); g.set(r, 14, 'sofa') }
  g.set(22, 9, 'rtable'); g.set(22, 10, 'rtable')
  g.set(26, 6, 'plant'); g.set(26, 16, 'plant')

  // ── ☕ 카페·바 (우하) — 긴 바 카운터 + 스툴 + 카페 테이블 ──
  g.rect(18, 28, 18, 42, 'bar')
  for (let c = 28; c <= 42; c += 2) g.set(19, c, 'barstool')
  for (const [r, c] of [[23, 30], [23, 38], [26, 31], [26, 39]]) { g.set(r, c, 'rtable'); g.set(r, c + 1, 'chair') }
  g.set(20, 45, 'plant'); g.set(27, 45, 'plant')

  // ── ⛲ 중앙 분수 ──
  g.set(14, 23, 'fountain'); g.set(14, 24, 'fountain')
  g.set(15, 23, 'fountain'); g.set(15, 24, 'fountain')

  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')

  const ZONES = [
    { text: '♨️ 온천', row: 3.2, col: 8, big: true },
    { text: '🎮 게임존', row: 1.2, col: 27, big: true },
    { text: '🛋️ 휴게실', row: 16.4, col: 8, big: true },
    { text: '☕ 카페 · 바', row: 16.4, col: 33, big: true },
    { text: '⛲ 중앙정원', row: 12.6, col: 21.6, small: true },
  ]

  // 분위기 파티클 — 온천 김(steam) + 게임존 반짝임(spark)
  const DECOR = [
    { kind: 'steam', row: 5, col: 6 }, { kind: 'steam', row: 6, col: 9 },
    { kind: 'steam', row: 5, col: 12 }, { kind: 'steam', row: 8, col: 7 },
    { kind: 'steam', row: 9, col: 11 }, { kind: 'steam', row: 7, col: 13 },
    { kind: 'spark', row: 2, col: 40 }, { kind: 'spark', row: 4, col: 44 },
    { kind: 'spark', row: 3, col: 37 }, { kind: 'spark', row: 2, col: 45 },
  ]

  return { COLS, ROWS, tiles: g.tiles, START: { row: 22, col: 23 }, SCREEN, ZONES, BOARDS: [], DECOR }
}

export const PLACES = {
  office: buildOffice(),
  conference: buildConference(),
  annex: buildAnnex(),
}
export const PLACE_LIST = [
  { key: 'office', label: '🏢 사무실' },
  { key: 'conference', label: '🎤 대회의실' },
  { key: 'annex', label: '🏨 별관' },
]

const BLOCKING = new Set([
  'wall', 'partition', 'deskpc', 'mgrdesk', 'mtable', 'rtable', 'board', 'screen', 'plant',
  // 별관 지형/가구
  'water', 'onsenrock', 'lantern', 'arcade', 'pool', 'shelf', 'bar', 'sofa', 'fountain',
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

// 프레즌스 상태 (자유/집중/회의/자리비움) — 점 색은 테마 무관 고정 토큰
export const STATUS = {
  free: { label: '자유', dot: 'var(--st-free)' },
  focus: { label: '집중', dot: 'var(--st-focus)' },
  meeting: { label: '회의 중', dot: 'var(--st-meeting)' },
  away: { label: '자리비움', dot: 'var(--st-away)' },
}
export const STATUS_ORDER = ['free', 'focus', 'meeting', 'away']
export const DEFAULT_STATUS = 'free'
