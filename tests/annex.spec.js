import { test, expect } from '@playwright/test'

// 별관(別館) — 단일 통합 맵: 룸 이동 모달 / 개인 순간이동 / 상호작용 / 펫 NPC / 모바일

async function enter(page, room = 't-annex') {
  await page.goto(`/?room=${room}`)
  await page.locator('.entry input').fill('데모')
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click().catch(() => {})
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const openModal = (page) => page.getByRole('button', { name: '별관 룸 이동' }).click()
const pickRoom = (page, label) => page.locator('.am-card').filter({ hasText: label }).first().click()
async function press(page, key, n) {
  for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(70) }
}

test('🏬 별관 버튼 → 룸 이동 모달(8개) 열기/닫기', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await expect(page.locator('.annex-modal')).toBeVisible()
  await expect(page.locator('.am-card')).toHaveCount(8)
  await page.keyboard.press('Escape')
  await expect(page.locator('.annex-modal')).toHaveCount(0)
})

test('룸 선택 → 별관 단일 맵 진입(온천/게임룸)', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickRoom(page, '온천')
  await expect(page.locator('.place-btn.annex-btn.on')).toBeVisible() // 별관 진입
  await expect(page.locator('.zone-label', { hasText: '온천' })).toBeVisible()
  expect(await page.locator('.tile.spaWater').count()).toBeGreaterThan(8)

  // 같은 맵 안에서 게임룸으로 개인 순간이동 (place는 그대로 annex)
  await openModal(page)
  await pickRoom(page, '게임룸')
  await expect(page.locator('.place-btn.annex-btn.on')).toBeVisible()
  expect(await page.locator('.tile.arcade').count()).toBeGreaterThan(0)
})

test('펫파크 — 고양이 NPC가 보인다', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickRoom(page, '펫파크')
  await expect(page.locator('.zone-label', { hasText: '펫파크' })).toBeVisible()
  expect(await page.locator('.npc-cat').count()).toBeGreaterThanOrEqual(1)
})

test('온천 상호작용(E) → 활동 상태 표시', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickRoom(page, '온천')
  // 온천 입구(entry)가 곧 상호작용 지점 → 바로 힌트
  await expect(page.locator('.interact-hint')).toContainText('온천')
  await page.keyboard.press('e')
  await expect(page.locator('.activity-overlay')).toContainText('온천')
  await expect(page.locator('.avatar.me.act-onsen')).toBeVisible()
})

test('헬스룸 기구 상호작용(E) → 운동 상태', async ({ page }) => {
  await enter(page)
  await openModal(page)
  await pickRoom(page, '헬스룸')
  // entry(21,12) → 아래로 덤벨 옆
  await press(page, 'ArrowDown', 3)
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
