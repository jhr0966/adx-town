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
  const COLS = 60, ROWS = 34
  const g = makeGrid(COLS, ROWS)
  g.rect(0, 0, ROWS - 1, COLS - 1, 'annexFloor')
  for (let c = 0; c < COLS; c++) { g.set(0, c, 'wall'); g.set(ROWS - 1, c, 'wall') }
  for (let r = 0; r < ROWS; r++) { g.set(r, 0, 'wall'); g.set(r, COLS - 1, 'wall') }
  // 중앙 가로 복도 — 모든 방이 면한다
  g.rect(15, 1, 18, COLS - 2, 'corridor')
  // 방 구획용 세로벽 (복도 rows15-18 은 비워 연결)
  for (const c of [15, 30, 45]) {
    for (let r = 1; r <= 14; r++) g.set(r, c, 'wall')
    for (let r = 19; r <= ROWS - 2; r++) g.set(r, c, 'wall')
  }

  // ── 🛋️ 휴게실 ── TV·ㄷ소파·책장·주크박스
  g.rect(3, 2, 13, 13, 'rug')
  g.set(2, 4, 'tv'); g.set(2, 5, 'tv')
  for (let c = 8; c <= 11; c++) g.set(2, c, 'shelf')
  for (let c = 4; c <= 10; c++) g.set(6, c, 'sofa')
  for (let r = 7; r <= 11; r++) { g.set(r, 4, 'sofa'); g.set(r, 10, 'sofa') }
  g.set(9, 7, 'rtable'); g.set(9, 8, 'rtable')
  g.set(12, 12, 'jukebox')
  g.set(2, 13, 'plant'); g.set(13, 2, 'plant'); g.set(13, 13, 'plant')

  // ── 🐾 펫파크 ── 잔디·캣타워·장난감·물그릇
  g.rect(2, 16, 13, 29, 'grass')
  g.set(3, 18, 'catTower'); g.set(3, 27, 'catTower'); g.set(9, 17, 'catTower')
  for (const [r, c] of [[7, 21], [11, 24], [5, 25], [10, 19]]) g.set(r, c, 'petToy')
  g.set(12, 28, 'rtable')
  for (const [r, c] of [[2, 16], [2, 29], [13, 16], [13, 29]]) g.set(r, c, 'plant')

  // ── 🏕️ 캠핑존 ── 캠프파이어·텐트·캠핑의자·등롱
  g.rect(2, 31, 13, 44, 'grass')
  g.set(8, 37, 'campfire')
  for (const [r, c] of [[7, 35], [7, 39], [10, 36], [10, 38]]) g.set(r, c, 'campChair')
  g.set(4, 33, 'tent'); g.set(4, 41, 'tent')
  g.set(11, 33, 'foodTable')
  for (const [r, c] of [[2, 32], [2, 43], [13, 32], [13, 43]]) g.set(r, c, 'lantern')

  // ── 🍽️ 식당 ── 배식대 + 식탁(양옆 의자) + 스툴
  g.rect(2, 46, 3, 57, 'cafeCounter')
  for (const [r, c] of [[6, 48], [6, 52], [6, 56], [9, 48], [9, 52], [9, 56]]) {
    g.set(r, c, 'foodTable'); g.set(r - 1, c, 'chair'); g.set(r + 1, c, 'chair')
  }
  for (const c of [48, 51, 54]) g.set(4, c, 'barstool')
  g.set(13, 46, 'plant'); g.set(13, 57, 'plant')

  // ── 🏋️ 헬스룸 ── 러닝·사이클·벤치·덤벨·요가·정수기·거울
  for (const c of [3, 6, 9]) g.set(20, c, 'treadmill')
  for (const c of [3, 6]) g.set(24, c, 'bike')
  g.set(28, 4, 'bench'); g.set(28, 7, 'bench')
  for (const r of [24, 26, 28]) g.set(r, 11, 'dumbbell')
  g.rect(30, 9, 31, 13, 'yoga')
  g.set(20, 12, 'watercooler')
  g.set(20, 2, 'mirror'); g.set(20, 3, 'mirror')
  g.set(31, 2, 'plant')

  // ── ♨️ 온천 ── 나무 데크 + 바위 테두리 + 대나무 + 등롱 + 상시 김
  g.rect(20, 16, 31, 29, 'deck')
  g.rect(21, 18, 30, 27, 'onsenrock')
  g.rect(22, 19, 29, 26, 'spaWater')
  for (const [r, c] of [[20, 18], [20, 27], [31, 18], [31, 27]]) g.set(r, c, 'bamboo')
  for (const [r, c] of [[20, 21], [20, 24], [31, 21], [31, 24]]) g.set(r, c, 'lantern')
  g.set(31, 16, 'towel'); g.set(20, 16, 'plant'); g.set(20, 29, 'plant'); g.set(31, 29, 'plant')

  // ── 🎮 게임룸 ── 아케이드·큰 당구대·다트·빈백·방탈출·리듬
  for (const c of [32, 34, 36]) g.set(20, c, 'arcade')
  g.rect(24, 33, 26, 39, 'pool')
  g.set(20, 42, 'dartboard')
  g.rect(29, 40, 30, 43, 'rug')
  g.set(31, 32, 'beanbag'); g.set(31, 33, 'beanbag')
  g.set(21, 42, 'escapeWall'); g.set(22, 42, 'keypad'); g.set(23, 42, 'escapeWall')

  // ── 🎤 노래방 ── 대형 화면 + 미러볼 + 무대 + 스툴
  const SCREEN = { row: 20, col: 48, w: 8, h: 4 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  g.set(25, 51, 'disco')
  g.rect(27, 47, 29, 56, 'rug')
  for (const c of [48, 51, 54]) g.set(31, c, 'barstool')
  g.set(20, 57, 'plant'); g.set(31, 57, 'plant')

  const ZONES = [
    { text: '🛋️ 휴게실', row: 1.2, col: 5, big: true },
    { text: '🐾 펫파크', row: 1.2, col: 20, big: true },
    { text: '🏕️ 캠핑존', row: 1.2, col: 35, big: true },
    { text: '🍽️ 식당', row: 1.2, col: 50, big: true },
    { text: '🏋️ 헬스룸', row: 19.2, col: 5, big: true },
    { text: '♨️ 온천', row: 19.2, col: 20, big: true },
    { text: '🎮 게임룸', row: 19.2, col: 35, big: true },
    { text: '🎤 노래방', row: 19.2, col: 50, big: true },
  ]
  const DECOR = [
    // 온천 상시 김
    { kind: 'steam', row: 23, col: 20 }, { kind: 'steam', row: 24, col: 22 }, { kind: 'steam', row: 22, col: 24 },
    { kind: 'steam', row: 26, col: 21 }, { kind: 'steam', row: 25, col: 25 }, { kind: 'steam', row: 27, col: 23 },
    { kind: 'steam', row: 28, col: 20 }, { kind: 'steam', row: 24, col: 26 },
    // 캠프파이어 불씨
    { kind: 'ember', row: 8, col: 37 }, { kind: 'ember', row: 7, col: 37 }, { kind: 'ember', row: 6, col: 37 },
    // 노래방 미러볼 반짝임
    { kind: 'spark', row: 23, col: 50 }, { kind: 'spark', row: 24, col: 53 }, { kind: 'spark', row: 22, col: 52 },
  ]
  const PETS = { count: 5, r0: 3, c0: 16, r1: 13, c1: 29 }

  // 온천 입욕 좌석 — 탕 안쪽 가장자리(rim) 물 타일. 진입 시 빈 자리 랜덤 착석.
  const ONSEN_SEATS = [
    { row: 22, col: 19 }, { row: 22, col: 21 }, { row: 22, col: 23 }, { row: 22, col: 25 },
    { row: 29, col: 20 }, { row: 29, col: 22 }, { row: 29, col: 24 }, { row: 29, col: 26 },
    { row: 24, col: 19 }, { row: 26, col: 19 }, { row: 28, col: 19 },
    { row: 23, col: 26 }, { row: 25, col: 26 }, { row: 27, col: 26 },
  ]

  const INTERACTIONS = [
    // 🛋️ 휴게실
    { id: 'lounge-sit', label: 'E: 소파에 앉기', type: 'sit', row: 12, col: 7, radius: 2.2, target: { row: 9, col: 7 }, activity: { type: 'relax', label: '😌 휴식 중' } },
    { id: 'tv', label: 'E: TV 보기', type: 'toast', row: 4, col: 5, radius: 2.2, message: '📺 재밌는 방송이 한창입니다' },
    { id: 'book', label: 'E: 책 읽기', type: 'toast', row: 3, col: 9, radius: 2.0, message: '📚 베스트셀러 한 권을 집어들었어요' },
    { id: 'jukebox', label: 'E: 음악 켜기', type: 'toast', row: 12, col: 11, radius: 1.8, message: '🎵 잔잔한 로파이가 흘러나옵니다' },
    // 🐾 펫파크
    { id: 'pet', label: 'E: 고양이와 놀기', type: 'toast', row: 8, col: 22, radius: 3.0, message: '🐱💕 고양이가 골골거리며 다가옵니다' },
    // 🏕️ 캠핑존
    { id: 'campfire', label: 'E: 불멍 즐기기', type: 'sit', row: 11, col: 37, radius: 2.2, target: { row: 9, col: 37 }, activity: { type: 'campfire', label: '🔥 불멍 중…' } },
    { id: 'marsh', label: 'E: 마시멜로 굽기', type: 'toast', row: 11, col: 34, radius: 1.8, message: '🔥🍡 마시멜로가 노릇노릇 구워집니다' },
    // 🍽️ 식당
    { id: 'order', label: 'E: 음식 주문', type: 'toast', row: 4, col: 51, radius: 2.4, message: '🍜🍙 라면과 김밥이 나왔습니다' },
    { id: 'diner-sit', label: 'E: 식탁에 앉기', type: 'sit', row: 8, col: 52, radius: 1.8, target: { row: 7, col: 52 }, activity: { type: 'eat', label: '🍽️ 식사 중' } },
    { id: 'dessert', label: 'E: 디저트 고르기', type: 'toast', row: 11, col: 56, radius: 2.0, message: '🧁 달콤한 디저트 한 입!' },
    // 🏋️ 헬스룸
    { id: 'treadmill', label: 'E: 러닝머신', type: 'gym', row: 21, col: 6, radius: 1.8, target: { row: 20, col: 6 }, activity: { type: 'gym-treadmill', label: '🏃 달리는 중' } },
    { id: 'bike', label: 'E: 사이클', type: 'gym', row: 25, col: 6, radius: 1.8, target: { row: 24, col: 6 }, activity: { type: 'gym-bike', label: '🚴 사이클' } },
    { id: 'bench', label: 'E: 벤치프레스', type: 'gym', row: 29, col: 5, radius: 1.8, target: { row: 28, col: 4 }, activity: { type: 'gym-bench', label: '💪 운동 중' } },
    { id: 'dumbbell', label: 'E: 덤벨 운동', type: 'gym', row: 25, col: 12, radius: 1.8, target: { row: 25, col: 12 }, activity: { type: 'gym-dumbbell', label: '💪 운동 중' } },
    { id: 'yoga', label: 'E: 요가·명상', type: 'gym', row: 30, col: 11, radius: 2.0, target: { row: 30, col: 11 }, activity: { type: 'yoga', label: '🧘 요가 중' } },
    { id: 'water', label: 'E: 물 마시기', type: 'toast', row: 21, col: 12, radius: 1.6, message: '💧 수분 충전 완료!' },
    // ♨️ 온천 — rim 랜덤 착석 + 잠김 + 수건 + 김
    { id: 'onsen', label: 'E: 온천 입욕', type: 'onsen', row: 25, col: 22, radius: 5, seats: ONSEN_SEATS, activity: { type: 'bath', label: '♨️ 노곤노곤' } },
    { id: 'towel', label: 'E: 수건 챙기기', type: 'toast', row: 31, col: 17, radius: 1.6, message: '🧖 뽀송한 수건을 챙겼어요' },
    // 🎮 게임룸
    { id: 'arcade', label: 'E: 게임 시작', type: 'minigame', row: 21, col: 34, radius: 2.4 },
    { id: 'pool', label: 'E: 당구 치기', type: 'toast', row: 27, col: 36, radius: 2.4, message: '🎱 나이스 샷! 8번 공 인!' },
    { id: 'dart', label: 'E: 다트 던지기', type: 'toast', row: 21, col: 42, radius: 1.6, message: '🎯 불스아이 명중!' },
    { id: 'rhythm', label: 'E: 리듬 발판에서 춤추기', type: 'dance', row: 30, col: 41, radius: 1.8 },
    { id: 'escape', label: 'E: 방탈출 도전', type: 'escape', row: 22, col: 41, radius: 2.0 },
    // 🎤 노래방
    { id: 'sing', label: 'E: 노래 부르기', type: 'dance', row: 28, col: 51, radius: 2.6 },
  ]

  return { COLS, ROWS, tiles: g.tiles, START: { row: 17, col: 29 }, SCREEN, ZONES, BOARDS: [], DECOR, PETS, INTERACTIONS }
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
  { key: 'lounge', icon: '🛋️', label: '휴게실', desc: 'TV·소파·주크박스', tags: ['소파', 'TV', '음악'], entry: { row: 13, col: 7 } },
  { key: 'petpark', icon: '🐾', label: '펫파크', desc: '고양이·잔디·장난감', tags: ['고양이', '잔디', '힐링'], entry: { row: 12, col: 22 } },
  { key: 'camp', icon: '🏕️', label: '캠핑존', desc: '불멍·텐트·마시멜로', tags: ['불멍', '텐트', '마시멜로'], entry: { row: 12, col: 37 } },
  { key: 'diner', icon: '🍽️', label: '식당', desc: '주문·식사·디저트', tags: ['주문', '식사', '디저트'], entry: { row: 12, col: 51 } },
  { key: 'gym', icon: '🏋️', label: '헬스룸', desc: '러닝·사이클·근력·요가', tags: ['러닝', '근력', '요가'], entry: { row: 22, col: 6 } },
  { key: 'spa', icon: '♨️', label: '온천', desc: '입욕·수건·김', tags: ['입욕', '수건', '힐링'], entry: { row: 20, col: 22 } },
  { key: 'game', icon: '🎮', label: '게임룸', desc: '아케이드·당구·다트·방탈출', tags: ['당구', '다트', '방탈출'], entry: { row: 21, col: 36 } },
  { key: 'karaoke', icon: '🎤', label: '노래방', desc: '노래·무대·미러볼', tags: ['노래', '무대', '댄스'], entry: { row: 30, col: 51 } },
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
