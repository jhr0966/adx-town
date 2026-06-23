import { test, expect } from '@playwright/test'

// 별관(別館) — 층 선택 모달 / 개인 이동 / 비상계단 / 상호작용 / 펫 NPC / 모바일

async function enter(page, room = 't-annex') {
  await page.goto(`/?room=${room}`)
  await page.locator('.entry input').fill('데모')
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click().catch(() => {})
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const openModal = (page) => page.getByRole('button', { name: '별관 층 선택' }).click()
const pickFloor = (page, label) =>
  page.locator('.am-card').filter({ hasText: label }).first().click()
async function press(page, key, n) {
  for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(70) }
}

test('🏬 별관 버튼 → 층 선택 모달 열기/닫기', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await expect(page.locator('.annex-modal')).toBeVisible()
  await expect(page.locator('.am-card')).toHaveCount(6)
  await page.keyboard.press('Escape')
  await expect(page.locator('.annex-modal')).toHaveCount(0)
})

test('B1 선택 → 온천·찜질방 / RF 선택 → 캠핑·야경 BAR', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickFloor(page, 'B1')
  await expect(page.locator('.zone-label', { hasText: '온천탕' })).toBeVisible()
  expect(await page.locator('.tile.spaWater').count()).toBeGreaterThan(10)

  await openModal(page)
  await expect(page.locator('.am-card.here')).toContainText('B1') // 현재 위치 배지
  await pickFloor(page, 'RF')
  await expect(page.locator('.zone-label', { hasText: '야경 BAR' })).toBeVisible()
  expect(await page.locator('.tile.campfire').count()).toBeGreaterThan(0)
})

test('펫파크(4F) — 고양이 NPC가 보인다', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickFloor(page, '4F')
  await expect(page.locator('.zone-label', { hasText: '펫파크' })).toBeVisible()
  expect(await page.locator('.npc-cat').count()).toBeGreaterThanOrEqual(1)
})

test('비상계단 — 1F에서 아래층(B1)으로 개인 이동', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickFloor(page, '1F')
  await expect(page.locator('.zone-label', { hasText: '카페테리아' })).toBeVisible()
  // START(18,14) → 아래(21) → 좌(3) 계단으로
  await press(page, 'ArrowDown', 3)
  await press(page, 'ArrowLeft', 11)
  await expect(page.locator('.interact-hint')).toContainText('아래층')
  await page.keyboard.press('e')
  await expect(page.locator('.zone-label', { hasText: '온천탕' })).toBeVisible()
})

test('온천 상호작용(E) → 활동 상태 표시', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickFloor(page, 'B1')
  // START(18,12) → 우(18) → 위(9) 온천 가장자리
  await press(page, 'ArrowRight', 6)
  await press(page, 'ArrowUp', 9)
  await expect(page.locator('.interact-hint')).toContainText('온천')
  await page.keyboard.press('e')
  await expect(page.locator('.activity-overlay')).toContainText('온천')
  await expect(page.locator('.avatar.me.act-onsen')).toBeVisible()
})

test('헬스장(3F) 기구 상호작용 → 운동 상태', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickFloor(page, '3F')
  // START(18,16) → 우(25) → 위(8) 덤벨존 옆
  await press(page, 'ArrowRight', 9)
  await press(page, 'ArrowUp', 10)
  await expect(page.locator('.interact-hint')).toBeVisible()
  await page.keyboard.press('e')
  await expect(page.locator('.activity-overlay')).toContainText('운동')
})

test('모바일 폭에서도 모달이 화면 안에 들어온다', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } })
  const page = await ctx.newPage()
  await enter(page)
  await openModal(page)
  const modal = page.locator('.annex-modal')
  await expect(modal).toBeVisible()
  const box = await modal.boundingBox()
  expect(box.width).toBeLessThanOrEqual(390)
  await ctx.close()
})
