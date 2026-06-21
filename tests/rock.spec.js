import { test, expect } from '@playwright/test'

// 돌 던지기 스킬 — 클릭한 곳에 돌, 맞으면 1초 기절, 1초 쿨다운

async function enter(page, name, room) {
  await page.goto('/?room=' + room)
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const posOf = (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop }))

test('돌을 던져 맞히면 기절 + 이동 차단', async ({ browser }) => {
  const room = 't-rock-' + Date.now()
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Thrower', room)
  await enter(b, 'Target', room)
  await expect(a.locator('.avatar:not(.me)')).toBeVisible({ timeout: 10000 })

  // B를 오른쪽으로 옮겨 A(START)와 다른 칸에 배치
  for (let i = 0; i < 4; i++) { await b.keyboard.press('ArrowRight'); await b.waitForTimeout(120) }
  await a.waitForTimeout(400)

  // A: 돌 던지기 모드 (follow 상태 = 카메라 안정 → 조준 정확)
  await a.locator('.tool-dock .tool[title*="돌"]').click()
  await expect(a.locator('.office.rock-aim')).toHaveCount(1)

  // A: B 아바타 위치 클릭 → 그 칸으로 돌
  const peer = a.locator('.avatar:not(.me)')
  const box = await peer.boundingBox()
  await a.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

  // B 기절 표시(별)
  await expect(b.locator('.avatar.me .stun'), 'B가 기절(별 표시)').toBeVisible({ timeout: 3000 })
  // 기절 중에는 이동 불가
  const before = await posOf(b.locator('.avatar.me'))
  await b.keyboard.press('ArrowRight')
  await b.waitForTimeout(200)
  expect(await posOf(b.locator('.avatar.me')), '기절 중 이동 차단').toEqual(before)

  // 1.2초 뒤 기절 해제 → 다시 이동 가능
  await b.waitForTimeout(1200)
  await expect(b.locator('.avatar.me .stun')).toHaveCount(0)
  await b.keyboard.press('ArrowRight')
  await expect
    .poll(async () => (await posOf(b.locator('.avatar.me'))).x, { timeout: 3000 })
    .toBeGreaterThan(before.x)

  await ctxA.close()
  await ctxB.close()
})

test('빗나가면(빈 칸) 아무도 기절하지 않음', async ({ browser }) => {
  const room = 't-rock-miss-' + Date.now()
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Thrower', room)
  await enter(b, 'Target', room)
  await expect(a.locator('.avatar:not(.me)')).toBeVisible({ timeout: 10000 })

  await a.locator('.tool-dock .tool[title*="돌"]').click()
  // 아무도 없는 빈 칸 클릭(도구바·채팅 패널 피해 중앙 상단)
  await a.locator('.stage').click({ position: { x: 520, y: 170 } })
  await a.waitForTimeout(1000)
  await expect(b.locator('.avatar.me .stun')).toHaveCount(0)

  await ctxA.close()
  await ctxB.close()
})
