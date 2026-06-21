import { test, expect } from '@playwright/test'

// 장소 이동: 한 명이 이동하면 모두 함께 이동, 전체보기 토글

async function enter(page, name) {
  await page.goto('/?room=t-place')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('장소 이동(대회의실) 다같이 + 전체보기', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Alice')
  await enter(b, 'Bob')

  // 기본은 사무실
  await expect(a.locator('.place-btn.on')).toHaveText('🏢 사무실')

  // A가 대회의실로 이동 → A·B 모두 대회의실로
  await a.locator('.place-btn', { hasText: '대회의실' }).click()
  await expect(a.locator('.place-btn.on'), 'A 대회의실').toHaveText('🎤 대회의실')
  await expect(b.locator('.place-btn.on'), 'B도 함께 대회의실로 이동').toHaveText('🎤 대회의실', { timeout: 10000 })

  // 전체보기 토글 동작
  const viewTool = a.locator('.tool-dock .tool[title*="보기"], .tool-dock .tool[title*="따라가기"]').first()
  await viewTool.click()
  await expect(viewTool).toContainText('🔍')

  await ctxA.close()
  await ctxB.close()
})
