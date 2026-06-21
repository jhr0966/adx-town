import { test, expect } from '@playwright/test'

// PC 커서 모드: 활성화하면 내 마우스 커서가 다른 사람에게 보임

async function enter(page, name) {
  await page.goto('/?room=t-cursor')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('PC 커서 공유', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Alice')
  await enter(b, 'Bob')

  // 커서 모드 켜기 + 마우스 이동(여러 번)
  await a.locator('.tool-dock button[title*="커서"]').click()
  await a.waitForTimeout(300)
  for (let i = 0; i < 8; i++) {
    await a.mouse.move(280 + i * 25, 280 + i * 18)
    await a.waitForTimeout(80)
  }

  // B 화면에 Alice 커서가 생겨야 함
  await expect(b.locator('.cursor'), 'B가 Alice 커서를 받아야 함').toHaveCount(1, { timeout: 8000 })
  await expect(b.locator('.cursor-name')).toHaveText('Alice')

  // 커서 모드 끄면 사라짐
  await a.locator('.tool-dock button[title*="커서"]').click()
  await expect(b.locator('.cursor'), '커서 모드 끄면 사라짐').toHaveCount(0)

  await ctxA.close()
  await ctxB.close()
})
