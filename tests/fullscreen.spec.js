import { test, expect } from '@playwright/test'

async function enter(page, name) {
  await page.goto('/?room=t-fs')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
  await page.locator('.tool-dock button[title="전체 보기"]').click() // 전체보기 → 스크린 보이게
}
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const canvasHasInk = (loc) =>
  loc.evaluate((cv) => {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true
    return false
  })

test('낙서한 스크린을 풀스크린으로 열면 낙서도 동기화 표시', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Drawer')
  await enter(b, 'Viewer')

  // A: 사진 업로드
  a.on('filechooser', (fc) => fc.setFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG }))
  await a.locator('.bigscreen-empty').click()
  await expect(a.locator('.bigscreen img')).toBeVisible()
  await expect(b.locator('.bigscreen img'), 'B도 사진 받음').toBeVisible({ timeout: 10000 })

  // A: 낙서 모드 켜고 한 획 그리기
  await a.locator('.bigscreen-bar button[title="낙서"]').click()
  const cv = a.locator('.bigscreen-canvas')
  const box = await cv.boundingBox()
  await a.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4)
  await a.mouse.down()
  await a.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 6 })
  await a.mouse.up()
  await a.locator('.bigscreen-bar button[title="낙서"]').click() // 낙서 끄기

  // B: 낙서가 전파됐는지(스크린 캔버스에 잉크) 후, 풀스크린 열기
  await expect.poll(() => canvasHasInk(b.locator('.bigscreen-canvas')), { timeout: 10000 }).toBe(true)
  await b.locator('.bigscreen img').click()
  await expect(b.locator('.screen-full')).toBeVisible()
  await expect(b.locator('.screen-full img')).toBeVisible()
  expect(await canvasHasInk(b.locator('.screen-full canvas')), '풀스크린에 낙서가 그려져야 함').toBe(true)

  await ctxA.close()
  await ctxB.close()
})
