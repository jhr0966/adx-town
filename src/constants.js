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

// ── 3) 별관(別館) — 여러 층(개인별 이동) ──
// 설계 메모: 사무실/대회의실은 기존처럼 room.setPlace()로 "전원 이동"을 유지(테스트 보존).
// 별관 층은 개인별 이동 — room.updateState({ place, row, col })로만 처리하고 setPlace를 쓰지 않는다.
// 같은 place(층)에 있는 사람만 서로의 아바타/말풍선/근접음성/미니맵에 보인다.
const ANNEX_W = 40, ANNEX_H = 24
const ST_UP = { row: 2, col: ANNEX_W - 3 }     // 위층 계단(우상)
const ST_DOWN = { row: ANNEX_H - 3, col: 2 }   // 아래층 계단(좌하)

function annexBase(g, { up, down }) {
  g.rect(0, 0, ANNEX_H - 1, ANNEX_W - 1, 'annexFloor')
  for (let c = 0; c < ANNEX_W; c++) { g.set(0, c, 'wall'); g.set(ANNEX_H - 1, c, 'wall') }
  for (let r = 0; r < ANNEX_H; r++) { g.set(r, 0, 'wall'); g.set(r, ANNEX_W - 1, 'wall') }
  if (up) g.set(ST_UP.row, ST_UP.col, 'stairUp')
  if (down) g.set(ST_DOWN.row, ST_DOWN.col, 'stairDown')
}
function stairInteractions({ up, down }) {
  const a = []
  if (up) a.push({ id: 'stair-up', label: 'E: 위층으로 이동', type: 'floor-change', row: ST_UP.row, col: ST_UP.col + 1, radius: 1.8, target: up })
  if (down) a.push({ id: 'stair-down', label: 'E: 아래층으로 이동', type: 'floor-change', row: ST_DOWN.row, col: ST_DOWN.col + 1, radius: 1.8, target: down })
  return a
}

// B1 — 힐링 온천·찜질방
function buildSpa() {
  const links = { up: 'annex-1f-food' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  // 온천탕 (좌측): 데크 + 바위 테두리 + 물
  g.rect(3, 3, 14, 17, 'deck')
  g.rect(4, 4, 13, 16, 'onsenrock')
  g.rect(5, 5, 12, 15, 'spaWater')
  for (const [r, c] of [[3, 3], [3, 17], [14, 3], [14, 17]]) g.set(r, c, 'lantern')
  // 찜질방 매트 (우측 상단) + 황토방/얼음방
  g.rect(3, 23, 8, 35, 'saunaMat')
  g.rect(11, 23, 12, 26, 'foodTable') // 식혜·계란 진열
  g.set(11, 23, 'foodTable')
  for (const [r, c] of [[16, 22], [16, 36], [3, 21], [20, 20]]) g.set(r, c, 'plant')
  const SCREEN = { row: 17, col: 24, w: 6, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '♨️ 온천탕', row: 2, col: 8, big: true },
    { text: '🧖 찜질방', row: 2, col: 27, big: true },
    { text: '🟤 황토방', row: 9.4, col: 24, small: true },
    { text: '🧊 얼음방', row: 9.4, col: 31, small: true },
  ]
  const DECOR = [
    { kind: 'steam', row: 6, col: 7 }, { kind: 'steam', row: 7, col: 10 }, { kind: 'steam', row: 6, col: 13 },
    { kind: 'steam', row: 9, col: 8 }, { kind: 'steam', row: 10, col: 12 },
  ]
  const INTERACTIONS = [
    { id: 'onsen', label: 'E: 온천 즐기기', type: 'onsen', row: 9, col: 18, radius: 2.4, target: { row: 9, col: 14 }, activity: { type: 'onsen', label: '온천 즐기는 중 ♨️' } },
    { id: 'lie', label: 'E: 찜질 매트에 눕기', type: 'sit', row: 6, col: 28, radius: 2.4, target: { row: 5, col: 28 }, activity: { type: 'lie', label: '지글지글 찜질 중 🧖' } },
    { id: 'sikhye', label: 'E: 식혜·계란 먹기', type: 'toast', row: 12, col: 24, radius: 2.2, message: '시원한 식혜와 따끈한 맥반석 계란 🥚 — 찜질방의 완성!' },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 18, col: 12 }, SCREEN, ZONES, BOARDS: [], DECOR, INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

// 1F — 카페테리아·포장마차
function buildFood() {
  const links = { up: 'annex-2f-game', down: 'annex-b1-spa' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  // 카페테리아(좌): 배식대 + 긴 테이블 + 디저트
  g.rect(3, 3, 3, 14, 'cafeCounter')
  for (const [r, c] of [[6, 4], [6, 7], [6, 10], [9, 4], [9, 7], [9, 10]]) { g.set(r, c, 'foodTable'); g.set(r + 1, c, 'chair') }
  g.set(3, 16, 'cafeCounter')
  // 포장마차(우): 빨간 천막 + 둥근 의자 + 냄비
  g.rect(4, 24, 5, 34, 'pochaTent')
  for (const c of [25, 28, 31, 34]) g.set(7, c, 'foodTable')
  for (const c of [25, 28, 31, 34]) g.set(8, c, 'barstool')
  for (const [r, c] of [[3, 21], [20, 6], [20, 33]]) g.set(r, c, 'plant')
  const SCREEN = { row: 13, col: 16, w: 6, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '☕ 카페테리아', row: 1.4, col: 5, big: true },
    { text: '🏮 포장마차', row: 2.2, col: 27, big: true },
  ]
  const DECOR = [{ kind: 'spark', row: 3, col: 25 }, { kind: 'spark', row: 3, col: 33 }, { kind: 'steam', row: 9, col: 29 }]
  const INTERACTIONS = [
    { id: 'coffee', label: 'E: 커피 주문', type: 'toast', row: 4, col: 8, radius: 2.4, message: '따뜻한 아메리카노가 나왔습니다 ☕' },
    { id: 'cafe-sit', label: 'E: 자리에 앉기', type: 'sit', row: 7, col: 7, radius: 1.8, target: { row: 7, col: 7 }, activity: { type: 'sit', label: '카페에서 수다 중 💬' } },
    { id: 'pocha', label: 'E: 포장마차에서 한 잔', type: 'sit', row: 8, col: 28, radius: 2.2, target: { row: 8, col: 28 }, activity: { type: 'sit', label: '어묵 국물에 라면 🍜' } },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 18, col: 14 }, SCREEN, ZONES, BOARDS: [], DECOR, INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

// 2F — 게임존·방탈출
function buildGame() {
  const links = { up: 'annex-3f-gym', down: 'annex-1f-food' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  // 오락실(좌)
  for (const c of [4, 6, 8, 10]) g.set(4, c, 'arcade')
  g.rect(8, 4, 9, 8, 'rug') // 리듬 발판
  g.set(12, 5, 'arcade'); g.set(12, 7, 'arcade')
  // 방탈출(우): 어두운 방 + 키패드 + 단서벽
  g.rect(3, 22, 12, 36, 'escapeWall')
  g.rect(5, 24, 10, 34, 'annexFloor')
  g.set(7, 35, 'keypad')
  for (const [r, c] of [[5, 25], [5, 30], [10, 28]]) g.set(r, c, 'foodTable') // 단서 카드 책상
  const SCREEN = { row: 3, col: 12, w: 7, h: 4 } // 대형 점수판
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '🎮 오락실', row: 1.6, col: 5, big: true },
    { text: '🔒 방탈출', row: 1.6, col: 27, big: true },
  ]
  const DECOR = [{ kind: 'spark', row: 5, col: 5 }, { kind: 'spark', row: 5, col: 9 }, { kind: 'spark', row: 13, col: 6 }]
  const INTERACTIONS = [
    { id: 'arcade', label: 'E: 게임 시작', type: 'minigame', row: 5, col: 6, radius: 2.2 },
    { id: 'rhythm', label: 'E: 리듬 발판에서 춤추기', type: 'dance', row: 10, col: 6, radius: 1.8 },
    { id: 'escape', label: 'E: 방탈출 도전', type: 'escape', row: 8, col: 35, radius: 2.4 },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 18, col: 14 }, SCREEN, ZONES, BOARDS: [], DECOR, INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

// 3F — 피트니스 센터
function buildGym() {
  const links = { up: 'annex-4f-rest-pet', down: 'annex-2f-game' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  for (const c of [5, 8, 11]) g.set(4, c, 'treadmill')      // 러닝머신
  for (const c of [5, 8, 11]) g.set(8, c, 'bike')           // 사이클
  g.set(12, 6, 'bench'); g.set(12, 9, 'bench')              // 벤치프레스
  g.rect(4, 22, 9, 30, 'rug')
  for (const [r, c] of [[5, 24], [5, 27], [7, 24], [7, 27]]) g.set(r, c, 'dumbbell') // 덤벨존
  g.rect(13, 24, 16, 32, 'yoga')                            // 요가매트
  for (const [r, c] of [[3, 34], [20, 6], [20, 30]]) g.set(r, c, 'plant')
  const SCREEN = { row: 13, col: 6, w: 6, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '🏃 유산소', row: 2, col: 6, big: true },
    { text: '🏋️ 웨이트', row: 2, col: 25, big: true },
    { text: '🧘 요가존', row: 11.4, col: 26, small: true },
  ]
  const INTERACTIONS = [
    { id: 'treadmill', label: 'E: 러닝머신', type: 'gym', row: 5, col: 8, radius: 2.2, target: { row: 4, col: 8 }, activity: { type: 'gym-treadmill', label: '러닝머신 운동 중 🏃' } },
    { id: 'bike', label: 'E: 사이클', type: 'gym', row: 9, col: 8, radius: 2.2, target: { row: 8, col: 8 }, activity: { type: 'gym-bike', label: '사이클 운동 중 🚴' } },
    { id: 'bench', label: 'E: 벤치프레스', type: 'gym', row: 13, col: 7, radius: 1.8, target: { row: 12, col: 6 }, activity: { type: 'gym-bench', label: '벤치프레스 운동 중 💪' } },
    { id: 'dumbbell', label: 'E: 덤벨 운동', type: 'gym', row: 6, col: 25, radius: 2.4, target: { row: 6, col: 25 }, activity: { type: 'gym-dumbbell', label: '덤벨 운동 중 💪' } },
    { id: 'yoga', label: 'E: 요가·명상', type: 'gym', row: 14, col: 28, radius: 2.4, target: { row: 14, col: 28 }, activity: { type: 'yoga', label: '요가·명상 중 🧘' } },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 18, col: 16 }, SCREEN, ZONES, BOARDS: [], DECOR: [], INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

// 4F — 펫파크·낮잠방
function buildRestPet() {
  const links = { up: 'annex-rf-rooftop', down: 'annex-3f-gym' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  // 펫파크(좌): 잔디 + 캣타워 + 장난감 + 물그릇
  g.rect(3, 3, 20, 18, 'grass')
  g.set(5, 6, 'catTower'); g.set(5, 13, 'catTower')
  for (const [r, c] of [[10, 6], [12, 14], [16, 9]]) g.set(r, c, 'petToy')
  g.set(8, 16, 'rtable') // 물그릇/쿠션
  // 낮잠방(우): 어두운 캡슐 침대
  g.rect(3, 22, 20, 37, 'napRoom')
  for (const r of [5, 8, 11, 14]) { g.set(r, 24, 'napBed'); g.set(r, 27, 'napBed') }
  for (const [r, c] of [[4, 34], [18, 34]]) g.set(r, c, 'lantern')
  const SCREEN = { row: 3, col: 31, w: 5, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '🐾 펫파크', row: 1.6, col: 8, big: true },
    { text: '🌙 낮잠방', row: 1.6, col: 28, big: true },
  ]
  const DECOR = [{ kind: 'spark', row: 6, col: 35 }, { kind: 'spark', row: 12, col: 32 }, { kind: 'spark', row: 16, col: 36 }]
  const PETS = { count: 4, r0: 4, c0: 3, r1: 19, c1: 17 } // 고양이 NPC 배회 영역(잔디)
  const INTERACTIONS = [
    { id: 'nap', label: 'E: 낮잠 자기', type: 'nap', row: 5, col: 25, radius: 2.0, target: { row: 5, col: 25 }, activity: { type: 'nap', label: '낮잠 자는 중 💤' } },
    { id: 'nap2', label: 'E: 낮잠 자기', type: 'nap', row: 11, col: 26, radius: 2.0, target: { row: 11, col: 27 }, activity: { type: 'nap', label: '낮잠 자는 중 💤' } },
    { id: 'play', label: 'E: 고양이와 놀기', type: 'toast', row: 16, col: 9, radius: 2.2, message: '고양이가 골골거리며 다가옵니다 🐱💕' },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 21, col: 20 }, SCREEN, ZONES, BOARDS: [], DECOR, PETS, INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

// RF — 캠핑 불멍·야경 BAR
function buildRooftop() {
  const links = { down: 'annex-4f-rest-pet' }
  const g = makeGrid(ANNEX_W, ANNEX_H)
  annexBase(g, links)
  for (let c = 1; c < ANNEX_W - 1; c++) g.set(1, c, 'skyline') // 스카이라인 배경
  // 캠핑 불멍존(좌/중)
  g.set(9, 9, 'campfire')
  for (const [r, c] of [[8, 7], [8, 11], [11, 9]]) g.set(r, c, 'campChair')
  g.set(6, 6, 'tent'); g.set(6, 12, 'tent')
  g.set(11, 6, 'foodTable') // 마시멜로/장작 테이블
  for (const [r, c] of [[4, 4], [4, 14]]) g.set(r, c, 'lantern')
  // 야경 BAR(우)
  g.rect(5, 26, 5, 35, 'barCounter')
  for (const c of [27, 29, 31, 33, 35]) g.set(6, c, 'barstool')
  for (const [r, c] of [[12, 28], [12, 33], [16, 30]]) { g.set(r, c, 'foodTable'); g.set(r + 1, c, 'barstool') }
  const SCREEN = { row: 3, col: 30, w: 5, h: 3 }
  g.rect(SCREEN.row, SCREEN.col, SCREEN.row + SCREEN.h - 1, SCREEN.col + SCREEN.w - 1, 'screen')
  const ZONES = [
    { text: '🔥 불멍존', row: 3.4, col: 8, big: true },
    { text: '🍸 야경 BAR', row: 3.4, col: 29, big: true },
  ]
  const DECOR = [
    { kind: 'ember', row: 9, col: 9 }, { kind: 'ember', row: 8, col: 9 },
    { kind: 'star', row: 2, col: 6 }, { kind: 'star', row: 2, col: 16 }, { kind: 'star', row: 2, col: 24 },
    { kind: 'star', row: 2, col: 32 }, { kind: 'star', row: 3, col: 20 },
  ]
  const INTERACTIONS = [
    { id: 'campfire', label: 'E: 불멍 즐기기', type: 'sit', row: 9, col: 9, radius: 2.4, target: { row: 11, col: 9 }, activity: { type: 'campfire', label: '불멍 중… 🔥' } },
    { id: 'marsh', label: 'E: 마시멜로 굽기', type: 'toast', row: 11, col: 6, radius: 2.0, message: '마시멜로가 노릇노릇 구워집니다 🔥🍡' },
    { id: 'bar', label: 'E: 음료 주문', type: 'toast', row: 6, col: 30, radius: 2.4, message: '무알콜 모히토가 나왔습니다 🍸 (시원한 탄산 + 라임)' },
  ]
  return { COLS: ANNEX_W, ROWS: ANNEX_H, tiles: g.tiles, START: { row: 20, col: 20 }, SCREEN, ZONES, BOARDS: [], DECOR, INTERACTIONS: [...INTERACTIONS, ...stairInteractions(links)] }
}

export const PLACES = {
  office: buildOffice(),
  conference: buildConference(),
  'annex-b1-spa': buildSpa(),
  'annex-1f-food': buildFood(),
  'annex-2f-game': buildGame(),
  'annex-3f-gym': buildGym(),
  'annex-4f-rest-pet': buildRestPet(),
  'annex-rf-rooftop': buildRooftop(),
}
// 상단바 "전원 이동" 버튼 — 별관 층은 여기 넣지 않는다(개인 이동, 모달로 진입).
export const PLACE_LIST = [
  { key: 'office', label: '🏢 사무실' },
  { key: 'conference', label: '🎤 대회의실' },
]
// 별관 층 메타 — 🏬 별관 버튼 → AnnexFloorModal 목록
export const ANNEX_FLOORS = [
  { key: 'annex-b1-spa', icon: '♨️', name: 'B1 힐링 온천·찜질방', desc: '온천, 찜질, 수건, 식혜', tags: ['온천', '찜질', '식혜'] },
  { key: 'annex-1f-food', icon: '🍜', name: '1F 카페테리아·포장마차', desc: '커피, 식사, 야식, 수다', tags: ['커피', '야식', '수다'] },
  { key: 'annex-2f-game', icon: '🎮', name: '2F 게임존·방탈출', desc: '오락실, 미니게임, 퍼즐', tags: ['오락실', '미니게임', '퍼즐'] },
  { key: 'annex-3f-gym', icon: '🏋️', name: '3F 피트니스 센터', desc: '러닝, 근력, 요가', tags: ['러닝', '근력', '요가'] },
  { key: 'annex-4f-rest-pet', icon: '🐾', name: '4F 펫파크·낮잠방', desc: '고양이, 휴식, Zzz', tags: ['고양이', '휴식', 'Zzz'] },
  { key: 'annex-rf-rooftop', icon: '🌃', name: 'RF 캠핑 불멍·야경 BAR', desc: '캠프파이어, 별, 루프탑', tags: ['캠프파이어', '별', '루프탑'] },
]
export const isAnnex = (place) => typeof place === 'string' && place.startsWith('annex')

const BLOCKING = new Set([
  'wall', 'partition', 'deskpc', 'mgrdesk', 'mtable', 'rtable', 'board', 'screen', 'plant',
  // 별관 지형/가구 (가까이 접근은 가능, 통과는 불가)
  'spaWater', 'onsenrock', 'lantern', 'arcade', 'escapeWall', 'keypad', 'cafeCounter',
  'foodTable', 'pochaTent', 'treadmill', 'bike', 'bench', 'dumbbell', 'catTower',
  'napBed', 'campfire', 'tent', 'barCounter', 'skyline', 'fountain',
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
