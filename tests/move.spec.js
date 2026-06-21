import { test, expect } from '@playwright/test'

// 클릭/탭 자동 이동(길찾기) + 모바일 커서 버튼

async function enter(page, name, room = 't-move') {
  await page.goto(`/?room=${room}`)
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
const posOf = (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop }))

test('PC: 위쪽 칸 클릭하면 자동으로 이동', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctx.newPage()
  await enter(a, 'Clicker', 't-move-pc')

  const meAv = a.locator('.avatar.me')
  await a.waitForTimeout(500) // 입장 직후 카메라 전환(0.18s)·정착 대기 → 클릭 좌표 안정화
  const before = await posOf(meAv)
  // 캐릭터(통로 col 11) 바로 위를 클릭 → 위로 자동 이동
  const av = await meAv.boundingBox()
  await a.mouse.click(av.x + av.width / 2, av.y - 150)
  await expect
    .poll(async () => (await posOf(meAv)).y, { timeout: 5000 })
    .toBeLessThan(before.y - 10)

  await ctx.close()
})

test('D패드: 누른 채 다른 방향으로 스와이프하면 그쪽으로 이동', async ({ browser }) => {
  // 좁은 뷰포트(=D패드 표시) + 마우스(=실제 pointer 이벤트로 스와이프 합성)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const a = await ctx.newPage()
  await enter(a, 'Swiper', 't-move-swipe')

  await expect(a.locator('.dpad')).toBeVisible()
  const meAv = a.locator('.avatar.me')
  const before = await posOf(meAv)
  const center = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 })
  const up = center(await a.locator('.dpad .up').boundingBox())
  const right = center(await a.locator('.dpad .right').boundingBox())

  // ▲ 버튼을 누른 뒤 손을 떼지 않고 ▶ 버튼으로 스와이프 → 오른쪽으로 이동해야 함
  await a.mouse.move(up.x, up.y)
  await a.mouse.down()
  await a.waitForTimeout(120)
  await a.mouse.move(right.x, right.y, { steps: 6 })
  await expect
    .poll(async () => (await posOf(meAv)).x, { timeout: 4000 })
    .toBeGreaterThan(before.x + 10)
  await a.mouse.up()

  await ctx.close()
})

test('모바일: 커서 버튼 표시 + 탭하면 이동', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const m = await ctx.newPage()
  await enter(m, 'Tapper', 't-move-mob')

  // 모바일에도 커서 버튼이 보여야 함
  await expect(m.locator('.tool-dock button[title*="커서"]')).toBeVisible()

  const meAv = m.locator('.avatar.me')
  const before = await posOf(meAv)
  // 캐릭터 바로 위를 탭 → 위로 자동 이동
  const av = await meAv.boundingBox()
  await m.touchscreen.tap(av.x + av.width / 2, av.y - 90)
  await m.waitForTimeout(2500)
  const after = await posOf(meAv)
  expect(after.y, '탭한 위쪽으로 이동해야 함').toBeLessThan(before.y - 10)

  await ctx.close()
})
