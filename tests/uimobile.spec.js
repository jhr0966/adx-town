import { test, expect } from '@playwright/test'

async function enter(page, name) {
  await page.goto('/?room=t-uimob')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const zIndex = (loc) => loc.evaluate((el) => parseInt(getComputedStyle(el).zIndex) || 0)

test('도구 버튼 라벨 표시', async ({ page }) => {
  await page.goto('/?room=t-uimob2')
  await page.locator('.entry input').fill('Labeler')
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.tool-dock button[title*="음성"]')).toContainText('음성')
  await expect(page.locator('.tool-dock button[title*="확성기"]')).toContainText('확성기')
  await expect(page.locator('.tool-dock button[title*="커서"]')).toContainText('커서')
})

test('모바일: 채팅 열면 도구 위에 표시 + D패드가 채팅 위로 이동', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const m = await ctx.newPage()
  await enter(m, 'MobUI')

  // 채팅 열기
  await m.locator('.chat-fab').click()
  await expect(m.locator('.chat.open')).toBeVisible()

  // 채팅이 좌상단 도구 바보다 위(z-index ↑) → 가려지지 않음
  expect(await zIndex(m.locator('.chat')), '채팅이 도구 바보다 위').toBeGreaterThan(
    await zIndex(m.locator('.tool-dock')),
  )

  // D패드가 채팅창 위로 올라와 가려지지 않음
  const dpad = await m.locator('.dpad').boundingBox()
  const chat = await m.locator('.chat').boundingBox()
  expect(dpad.y + dpad.height, 'D패드가 채팅 위에 있어야 함').toBeLessThanOrEqual(chat.y + 4)

  // 최소화해도 D패드가 입력창 위에 보임
  await m.locator('.chat-min').click()
  const dpad2 = await m.locator('.dpad').boundingBox()
  const chat2 = await m.locator('.chat').boundingBox()
  expect(dpad2.y + dpad2.height, '최소화 시에도 D패드가 채팅 위').toBeLessThanOrEqual(chat2.y + 4)

  await ctx.close()
})
