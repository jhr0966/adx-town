import { test, expect } from '@playwright/test'

// 모바일 최적화 검증: D-패드 이동, 채팅 토글, 안 읽은 메시지 뱃지

async function enter(page, name) {
  await page.goto('/?room=t-mobile')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const posOf = (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop }))
function chatInput(page) {
  return page.locator('.chat-input input[placeholder*="메시지"]')
}

test('모바일: D패드 이동 + 채팅 토글 + 안읽음 뱃지', async ({ browser }) => {
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const m = await mob.newPage()
  const d = await desk.newPage()

  await enter(m, 'Mobile')
  await enter(d, 'Desk')

  // 1) 모바일: D패드 보이고, 채팅은 기본 닫힘(FAB 보임)
  await expect(m.locator('.dpad'), 'D패드 표시').toBeVisible()
  await expect(m.locator('.chat-fab'), '채팅 열기 버튼 표시').toBeVisible()
  await expect(m.locator('.chat.open')).toHaveCount(0)

  // 2) D패드로 이동
  const meAvatar = m.locator('.avatar.me')
  const before = await posOf(meAvatar)
  await m.locator('.dpad .dp.right').click()
  await m.waitForTimeout(300)
  const after = await posOf(meAvatar)
  expect(after.x, 'D패드 오른쪽으로 이동').toBeGreaterThan(before.x)

  // 3) 데스크탑이 채팅 보냄 → 모바일은 닫혀 있으므로 뱃지에 카운트
  await chatInput(d).fill('hi-mobile')
  await chatInput(d).press('Enter')
  await expect(m.locator('.chat-badge'), '안읽음 뱃지 표시').toHaveText('1')

  // 4) 모바일이 채팅 열기 → 메시지 보이고 뱃지 사라짐
  await m.locator('.chat-fab').click()
  await expect(m.locator('.chat.open')).toBeVisible()
  await expect(m.locator('.chat-list')).toContainText('hi-mobile')
  await expect(m.locator('.chat-fab')).toHaveCount(0)

  await mob.close()
  await desk.close()
})
