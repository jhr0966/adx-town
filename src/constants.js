// 맵 / 아바타 공통 설정 — 여러 장소(PLACES) 지원
//
// 각 장소는 { COLS, ROWS, tiles, START, SCREEN, ZONES, BOARDS } 를 가진다.
// 사무실/대회의실은 전원 이동(setPlace). 별관은 단일 맵(한 층)으로, 방을
// 공간으로 나눈다 — 같은 별관에 있는 사람은 모두 한 맵에서 서로 보이고,
// 상단 "🏬 별관" 모달의 ROOMS 로 내 위치만 개인 순간이동한다.

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
  for (let c = 9; c <= 20; c++) { g.set(4, c, 'chair'); g.set(3, c, 'deskpc') }
  for (let c = 9; c <= 20; c++) { g.set(15, c, 'chair'); g.set(16, c, 'deskpc') }
  for (let r = 6; r <= 13; r++) { g.set(r, 7, 'chair'); g.set(r, 6, 'deskpc') }
  for (let r = 6; r <= 13; r++) { g.set(r, 22, 'chair'); g.set(r, 23, 'deskpc') }

  for (const [r, c] of [[2, 2], [2, COLS - 3], [ROWS - 3, 2], [ROWS - 3, COLS - 3]]) g.set(r, c, 'plant')

  const ZONES = [{ text: '🎤 대회의실', row: 1, col: 12, big: true }]
  return { COLS, ROWS, tiles: g.tiles, START: { row: 18, col: 14 }, SCREEN, ZONES, BOARDS: [] }
}

// ── 3) 별관(別館) — 단일 맵(한 층). 8개 방을 벽+중앙 복도로 구획.
//   상단 행: 🛋️휴게실 · 🐾펫파크 · 🏕️캠핑존 · 🍽️식당
//   하단 행: 🏋️헬스룸 · ♨️온천 · 🎮게임룸 · 🎤노래방
function buildAnnex() {
  const COLS = 48, ROWS = 26
  const g = makeGrid(COLS, ROWS)
  g.rect(0, 0, ROWS - 1, COLS - 1, 'annexFloor')
  for (let c = 0; c < COLS; c++) { g.set(0, c, 'wall'); g.set(ROWS - 1, c, 'wall') }
  for (let r = 0; r < ROWS; r++) { g.set(r, 0, 'wall'); g.set(r, COLS - 1, 'wall') }

  // 중앙 가로 복도
  g.rect(12, 1, 13, COLS - 2, 'corridor')
  // 방 사이 세로 벽 (서로 다른 너비)
  for (const c of [11, 25, 34]) for (let r = 1; r <= 10; r++) g.set(r, c, 'wall')
  for (const c of [14, 25, 36]) for (let r = 15; r <= ROWS - 2; r++) g.set(r, c, 'wall')
  // 방 ↔ 복도 칸막이(row11/row14) + 방마다 출입구 3칸
  for (let c = 1; c <= COLS - 2; c++) { g.set(11, c, 'wall'); g.set(14, c, 'wall') }
  for (const c of [4, 5, 6, 17, 18, 19, 28, 29, 30, 39, 40, 41]) g.set(11, c, 'doorway')
  for (const c of [5, 6, 7, 18, 19, 20, 29, 30, 31, 40, 41, 42]) g.set(14, c, 'doorway')

  // 방 바닥 색은 RoomTints 레이어가 담당(타일 아님) → 장식 타일과 이질감 없음
  const TINTS = [
    { row: 1, col: 1, w: 10, h: 10, k: 'green' },   // 휴게실
    { row: 1, col: 12, w: 13, h: 10, k: 'green' },  // 펫파크
    { row: 1, col: 26, w: 8, h: 10, k: 'green' },   // 캠핑
    { row: 1, col: 35, w: 12, h: 10, k: 'tan' },    // 식당
    { row: 15, col: 1, w: 13, h: 10, k: 'peach' },  // 헬스룸
    { row: 15, col: 15, w: 10, h: 10, k: 'green' }, // 온천
    { row: 15, col: 26, w: 10, h: 10, k: 'purple' },// 게임룸
    { row: 15, col: 37, w: 10, h: 10, k: 'lav' },   // 노래방
  ]

  // ── 🛋️ 휴게실 (cols1-10) ── 코너·벽 따라 정돈
  g.set(1, 4, 'tv'); g.set(1, 5, 'tv')
  g.set(1, 2, 'shelf'); g.set(1, 3, 'shelf')
  for (let c = 3; c <= 7; c++) g.set(3, c, 'sofa')
  for (let r = 4; r <= 6; r++) { g.set(r, 3, 'sofa'); g.set(r, 7, 'sofa') }
  g.set(5, 5, 'rtable')
  g.set(9, 9, 'jukebox'); g.set(9, 1, 'plant'); g.set(1, 9, 'plant')

  // ── 🐾 펫파크 (cols12-24) ── 캣타워 코너 + 장난감 정렬
  g.set(1, 13, 'catTower'); g.set(1, 23, 'catTower')
  for (const c of [16, 18, 20, 22]) g.set(7, c, 'petToy')
  g.set(9, 13, 'rtable')
  g.set(9, 24, 'plant'); g.set(1, 18, 'plant')

  // ── 🏕️ 캠핑 (cols26-33) ── 모닥불 중심 대칭
  g.set(5, 29, 'campfire')
  for (const [r, c] of [[4, 28], [4, 30], [6, 28], [6, 30]]) g.set(r, c, 'campChair')
  g.set(1, 27, 'tent'); g.set(1, 32, 'tent')
  g.set(9, 27, 'foodTable')
  g.set(1, 26, 'lantern'); g.set(1, 33, 'lantern'); g.set(9, 33, 'plant')

  // ── 🍽️ 식당 (cols35-46) ── 카운터 + 2칸 식탁
  const DINING = [[4, 37], [4, 42], [8, 37], [8, 42]]
  const FOODS = ['🍜', '🍱', '🍣', '🍛']
  for (const [r, c] of DINING) {
    g.set(r - 1, c, 'chair'); g.set(r + 1, c, 'chair')
    g.set(r - 1, c + 1, 'chair'); g.set(r + 1, c + 1, 'chair')
  }
  for (const c of [38, 41, 44]) g.set(2, c, 'barstool')
  g.set(10, 35, 'plant'); g.set(10, 46, 'plant')

  // ── 🏋️ 헬스룸 (cols1-13) ── 출입구(5-7) 비우고 기구 정렬
  g.set(15, 2, 'treadmill'); g.set(15, 3, 'treadmill')
  g.set(15, 10, 'treadmill'); g.set(15, 11, 'treadmill')
  g.set(18, 2, 'bike'); g.set(18, 3, 'bike')
  g.set(21, 2, 'bench'); g.set(21, 4, 'bench')
  for (const r of [18, 20, 22]) g.set(r, 12, 'dumbbell')
  g.rect(22, 7, 24, 10, 'yoga')
  g.set(15, 6, 'watercooler'); g.set(24, 1, 'plant')

  // ── ♨️ 온천 (cols15-24) ── 가로 직사각 욕탕(오브젝트) + 둘레 정돈
  g.set(15, 16, 'bamboo'); g.set(15, 23, 'bamboo')
  g.set(21, 16, 'lantern'); g.set(21, 23, 'lantern')
  g.set(23, 16, 'towel'); g.set(15, 24, 'plant'); g.set(24, 23, 'plant')

  // ── 🎮 게임룸 (cols26-35) ── 아케이드 좌측벽 / 당구 중앙 / 다트·방탈출 우측
  for (const r of [16, 18, 20]) g.set(r, 27, 'arcade')
  g.set(16, 34, 'dartboard'); g.set(20, 34, 'keypad')
  g.set(23, 28, 'beanbag'); g.set(23, 29, 'beanbag')
  g.set(24, 26, 'plant'); g.set(24, 35, 'plant')

  // ── 🎤 노래방 (cols37-46) ── 화면은 아래쪽 벽, 위쪽은 입장 통로 확보
  const SCREEN = { row: 19, col: 39, w: 6, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  g.set(17, 41, 'disco')
  g.rect(22, 38, 23, 45, 'rug')
  for (const c of [38, 41, 44]) g.set(24, c, 'barstool')
  g.set(15, 46, 'plant'); g.set(24, 46, 'plant')

  const ZONES = [
    { text: '🛋️ 휴게실', row: 0.2, col: 3, big: true },
    { text: '🐾 펫파크', row: 0.2, col: 16, big: true },
    { text: '🏕️ 캠핑', row: 0.2, col: 28, big: true },
    { text: '🍽️ 식당', row: 0.2, col: 39, big: true },
    { text: '🏋️ 헬스룸', row: 13.4, col: 5, big: true },
    { text: '♨️ 온천', row: 13.4, col: 18, big: true },
    { text: '🎮 게임룸', row: 13.4, col: 29, big: true },
    { text: '🎤 노래방', row: 13.4, col: 40, big: true },
  ]
  const DECOR = [
    { kind: 'steam', row: 17, col: 18 }, { kind: 'steam', row: 18, col: 20 }, { kind: 'steam', row: 19, col: 19 },
    { kind: 'steam', row: 18, col: 21 }, { kind: 'steam', row: 19, col: 22 },
    { kind: 'ember', row: 5, col: 29 }, { kind: 'ember', row: 4, col: 29 },
    { kind: 'spark', row: 17, col: 41 }, { kind: 'spark', row: 22, col: 43 },
  ]
  const PETS = { count: 4, r0: 2, c0: 12, r1: 9, c1: 24 }

  // 온천 입욕 좌석 — 가로 욕탕 가장자리(rows17-20 cols17-22)
  const ONSEN_SEATS = [
    { row: 17, col: 18 }, { row: 17, col: 20 }, { row: 17, col: 21 },
    { row: 20, col: 18 }, { row: 20, col: 20 }, { row: 20, col: 21 },
    { row: 18, col: 17 }, { row: 19, col: 17 },
    { row: 18, col: 22 }, { row: 19, col: 22 },
  ]

  const INTERACTIONS = [
    { id: 'tv', label: 'TV 보기', type: 'sit', row: 2, col: 4, radius: 2.0, target: { row: 5, col: 5 }, activity: { type: 'tv', label: '📺 시청 중' } },
    { id: 'book', label: '책 읽기', type: 'toast', row: 2, col: 3, radius: 1.8, message: '📚 베스트셀러 한 권을 집어들었어요' },
    { id: 'lounge-sit', label: '소파에 앉기', type: 'sit', row: 4, col: 5, radius: 1.8, target: { row: 5, col: 5 }, activity: { type: 'relax', label: '😌 휴식 중' } },
    { id: 'jukebox', label: '음악 켜기', type: 'toast', row: 8, col: 9, radius: 1.8, message: '🎵 잔잔한 로파이가 흘러나옵니다' },
    { id: 'pet', label: '고양이와 놀기', type: 'toast', row: 6, col: 18, radius: 2.6, message: '🐱💕 고양이가 골골거리며 다가옵니다' },
    { id: 'cattoy', label: '장난감 던지기', type: 'toast', row: 8, col: 20, radius: 2.2, message: '🧶 고양이가 신나게 쫓아갑니다!' },
    { id: 'campfire', label: '불멍 즐기기', type: 'sit', row: 7, col: 29, radius: 2.2, target: { row: 6, col: 28 }, activity: { type: 'campfire', label: '🔥 불멍 중…' } },
    { id: 'marsh', label: '마시멜로 굽기', type: 'toast', row: 9, col: 27, radius: 1.8, message: '🔥🍡 마시멜로가 노릇노릇 구워집니다' },
    { id: 'tent', label: '텐트에서 쉬기', type: 'toast', row: 2, col: 27, radius: 1.8, message: '⛺ 텐트 안에서 잠깐 휴식~' },
    { id: 'order', label: '음식 주문', type: 'toast', row: 2, col: 41, radius: 2.2, message: '🍜🍙 라면과 김밥이 나왔습니다' },
    { id: 'diner-sit', label: '식탁에 앉기', type: 'sit', row: 6, col: 38, radius: 1.8, target: { row: 5, col: 37 }, activity: { type: 'eat', label: '🍽️ 식사 중' } },
    { id: 'dessert', label: '디저트 고르기', type: 'toast', row: 9, col: 43, radius: 2.0, message: '🧁 달콤한 디저트 한 입!' },
    { id: 'treadmill', label: '러닝머신', type: 'gym', row: 16, col: 3, radius: 1.8, target: { row: 15, col: 3 }, activity: { type: 'gym-treadmill', label: '🏃 달리는 중' } },
    { id: 'bike', label: '사이클', type: 'gym', row: 19, col: 3, radius: 1.8, target: { row: 18, col: 3 }, activity: { type: 'gym-bike', label: '🚴 사이클' } },
    { id: 'bench', label: '벤치프레스', type: 'gym', row: 22, col: 3, radius: 1.8, target: { row: 21, col: 2 }, activity: { type: 'gym-bench', label: '💪 운동 중' } },
    { id: 'dumbbell', label: '덤벨 운동', type: 'gym', row: 20, col: 11, radius: 1.6, target: { row: 20, col: 11 }, activity: { type: 'gym-dumbbell', label: '💪 운동 중' } },
    { id: 'yoga', label: '요가·명상', type: 'gym', row: 23, col: 8, radius: 1.8, target: { row: 23, col: 8 }, activity: { type: 'yoga', label: '🧘 요가 중' } },
    { id: 'water', label: '물 마시기', type: 'toast', row: 16, col: 6, radius: 1.6, message: '💧 수분 충전 완료!' },
    { id: 'onsen', label: '온천 입욕', type: 'onsen', row: 16, col: 19, radius: 4, seats: ONSEN_SEATS, activity: { type: 'bath', label: '♨️ 노곤노곤', exit: { row: 16, col: 19 } } },
    { id: 'towel', label: '수건 챙기기', type: 'toast', row: 23, col: 17, radius: 1.6, message: '🧖 뽀송한 수건을 챙겼어요' },
    { id: 'arcade', label: '게임 시작', type: 'minigame', row: 17, col: 28, radius: 2.0 },
    { id: 'pool', label: '당구 치기', type: 'toast', row: 21, col: 32, radius: 2.2, message: '🎱 나이스 샷! 8번 공 인!' },
    { id: 'dart', label: '다트 던지기', type: 'toast', row: 17, col: 34, radius: 1.6, message: '🎯 불스아이 명중!' },
    { id: 'beanbag', label: '빈백에 앉기', type: 'sit', row: 22, col: 29, radius: 1.6, target: { row: 23, col: 29 }, activity: { type: 'relax', label: '😌 늘어지는 중' } },
    { id: 'escape', label: '방탈출 도전', type: 'escape', row: 20, col: 33, radius: 1.8 },
    { id: 'sing', label: '노래 부르기', type: 'dance', row: 22, col: 41, radius: 2.6 },
    { id: 'screen', label: '노래 예약', type: 'toast', row: 21, col: 41, radius: 1.8, message: '🎤 다음 곡 예약 완료!' },
  ]

  const OBJECTS = [
    { kind: 'onsen', row: 17, col: 17, w: 6, h: 4 },
    { kind: 'pooltable', row: 18, col: 30, w: 5, h: 3 },
    { kind: 'counter', row: 1, col: 36, w: 10, h: 1 },
    ...DINING.map(([r, c], i) => ({ kind: 'table', row: r, col: c, w: 2, h: 1, emoji: FOODS[i % FOODS.length] })),
  ]
  const solid = new Set()
  for (const o of OBJECTS) {
    for (let r = o.row; r < o.row + o.h; r++) for (let c = o.col; c < o.col + o.w; c++) solid.add(`${r},${c}`)
  }

  return { COLS, ROWS, tiles: g.tiles, START: { row: 13, col: 24 }, SCREEN, ZONES, TINTS, BOARDS: [], DECOR, PETS, INTERACTIONS, OBJECTS, solid }
}

export const PLACES = {
  office: buildOffice(),
  conference: buildConference(),
  annex: buildAnnex(),
}
// 상단 "전원 이동" 버튼 — 별관은 여기 넣지 않는다(개인 입장, 모달로 진입).
export const PLACE_LIST = [
  { key: 'office', label: '🏢 사무실' },
  { key: 'conference', label: '🎤 대회의실' },
]
// 별관 방 메타 — 🏬 별관 버튼 → 룸 이동 모달. entry 로 내 위치만 개인 순간이동.
export const ROOMS = [
  { key: 'lounge', icon: '🛋️', label: '휴게실', desc: 'TV·소파·주크박스', tags: ['소파', 'TV', '음악'], entry: { row: 10, col: 5 } },
  { key: 'petpark', icon: '🐾', label: '펫파크', desc: '고양이·잔디·장난감', tags: ['고양이', '잔디', '힐링'], entry: { row: 10, col: 18 } },
  { key: 'camp', icon: '🏕️', label: '캠핑존', desc: '불멍·텐트·마시멜로', tags: ['불멍', '텐트', '마시멜로'], entry: { row: 10, col: 29 } },
  { key: 'diner', icon: '🍽️', label: '식당', desc: '주문·식사·디저트', tags: ['주문', '식사', '디저트'], entry: { row: 10, col: 40 } },
  { key: 'gym', icon: '🏋️', label: '헬스룸', desc: '러닝·사이클·근력·요가', tags: ['러닝', '근력', '요가'], entry: { row: 16, col: 3 } },
  { key: 'spa', icon: '♨️', label: '온천', desc: '입욕·수건·김', tags: ['입욕', '수건', '힐링'], entry: { row: 16, col: 19 } },
  { key: 'game', icon: '🎮', label: '게임룸', desc: '아케이드·당구·다트·방탈출', tags: ['당구', '다트', '방탈출'], entry: { row: 16, col: 30 } },
  { key: 'karaoke', icon: '🎤', label: '노래방', desc: '노래·무대·미러볼', tags: ['노래', '무대', '댄스'], entry: { row: 16, col: 41 } },
]
export const isAnnex = (place) => place === 'annex'

const BLOCKING = new Set([
  'wall', 'partition', 'deskpc', 'mgrdesk', 'mtable', 'rtable', 'board', 'screen', 'plant',
  // 별관 지형/가구 (가까이 접근은 가능, 통과는 불가)
  'spaWater', 'onsenrock', 'lantern', 'arcade', 'escapeWall', 'keypad', 'cafeCounter',
  'foodTable', 'treadmill', 'bike', 'bench', 'dumbbell', 'catTower', 'campfire', 'tent',
  'barCounter', 'pool', 'sofa', 'shelf',
  // 신규 장식/가구
  'bamboo', 'towel', 'tv', 'jukebox', 'dartboard', 'watercooler', 'mirror',
])

export function tileType(place, row, col) {
  return place.tiles[`${row},${col}`] || 'floor'
}
export function isWall(place, row, col) {
  if (place.solid && place.solid.has(`${row},${col}`)) return true // 큰 오브젝트 풋프린트
  return BLOCKING.has(tileType(place, row, col))
}

// 선택 가능한 아바타 (이모지)
export const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🐰', '🐸', '🐵', '🦁', '🐯', '🐨', '🐧', '🦄']

// 아바타별 귀여운 랜덤 닉네임 (이름 미입력 시): 접두사 + 동물명
const NICK_PARTS = {
  '🦊': { base: '여우', pre: ['새침한', '도시', '꼬리아홉', '간식도둑'] },
  '🐱': { base: '고양이', pre: ['츤데레', '식빵굽는', '집사홀린', '낮잠왕'] },
  '🐶': { base: '강아지', pre: ['해맑은', '산책가는', '꼬리흔드는', '간식셔틀'] },
  '🐼': { base: '팬더', pre: ['쿵푸', '대나무', '먹보', '데굴데굴'] },
  '🐰': { base: '토끼', pre: ['달나라', '당근킬러', '깡총', '귀쫑긋'] },
  '🐸': { base: '개구리', pre: ['슬픈', '신사동', '연못', '폴짝'] },
  '🐵': { base: '원숭이', pre: ['날쌘', '바나나', '장난꾸러기', '나무타는'] },
  '🦁': { base: '사자', pre: ['용맹한', '갈기휘날리는', '백수의왕', '늠름한'] },
  '🐯': { base: '호랭이', pre: ['신사동', '줄무늬', '어흥', '산속'] },
  '🐨': { base: '코알라', pre: ['잠많은', '유칼립투스', '느긋한', '껌딱지'] },
  '🐧': { base: '펭귄', pre: ['턱시도', '뒤뚱', '남극', '빙판위'] },
  '🦄': { base: '유니콘', pre: ['무지개', '반짝이는', '전설의', '꿈꾸는'] },
}
export function randomNickname(avatar) {
  const n = NICK_PARTS[avatar] || { base: '게스트', pre: ['반가운', '신비한'] }
  return n.pre[Math.floor(Math.random() * n.pre.length)] + n.base
}

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
