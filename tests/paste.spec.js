import { test, expect } from '@playwright/test'

// 클립보드 이미지 붙여넣기(전역 paste) → 스크린에 표시 + 전파

async function enter(page, name) {
  await page.goto('/?room=t-paste')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
  await page.locator('.tool-dock button[title="전체 보기"]').click() // 전체보기 → 스크린 보이게
}
const B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

test('클립보드 이미지 붙여넣기 → 스크린 공유', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Paster')
  await enter(b, 'Viewer')

  await expect(a.locator('.bigscreen-blank')).toBeVisible() // 빈 스크린

  // A: paste 이벤트 합성(클립보드에 이미지가 있는 상황)
  await a.evaluate(async (b64) => {
    const blob = await (await fetch('data:image/png;base64,' + b64)).blob()
    const file = new File([blob], 'p.png', { type: 'image/png' })
    const dt = new DataTransfer()
    dt.items.add(file)
    const evt = new Event('paste', { bubbles: true })
    Object.defineProperty(evt, 'clipboardData', { value: dt })
    window.dispatchEvent(evt)
  }, B64)

  await expect(a.locator('.bigscreen img'), '붙여넣은 사진이 스크린에 표시').toBeVisible({ timeout: 8000 })
  await expect(b.locator('.bigscreen img'), 'B에게도 전파').toBeVisible({ timeout: 10000 })

  await ctxA.close()
  await ctxB.close()
})
