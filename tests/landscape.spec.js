import { test, expect } from '@playwright/test'

// 모바일 가로모드: 기능 도구 바와 이동(D패드)이 겹치지 않아야 함

async function enter(page, name) {
  await page.goto('/?room=t-landscape')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

const overlaps = (a, b) =>
  !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)

test('가로모드: 도구 바와 D패드 안 겹침', async ({ browser }) => {
  // 가로 폰 (세로 짧음, 터치)
  const ctx = await browser.newContext({ viewport: { width: 740, height: 360 }, hasTouch: true, isMobile: true })
  const m = await ctx.newPage()
  await enter(m, 'Land')

  await expect(m.locator('.dpad')).toBeVisible()
  await expect(m.locator('.tool-dock')).toBeVisible()
  const td = await m.locator('.tool-dock').boundingBox()
  const dp = await m.locator('.dpad').boundingBox()
  expect(overlaps(td, dp), '도구 바와 D패드가 겹치면 안 됨').toBe(false)

  // 가로 도구 바는 D패드보다 위에 위치
  expect(td.y + td.height, '도구 바가 D패드 위').toBeLessThanOrEqual(dp.y + 2)

  await ctx.close()
})
