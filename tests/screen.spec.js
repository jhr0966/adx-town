import { test, expect } from '@playwright/test'

// 휴식공간 대형 스크린에 사진 업로드 → 모두의 맵 스크린(액자)에 표시되는지 검증

async function enter(page, name) {
  await page.goto('/?room=t-screen')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

test('대형 스크린 사진 공유', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()

  await enter(a, 'Alice')
  await enter(b, 'Bob')

  // 스크린이 한눈에 보이도록 전체보기로
  await a.locator('.tool-dock button[title="전체 보기"]').click()
  await b.locator('.tool-dock button[title="전체 보기"]').click()

  // 처음엔 빈 스크린(업로드 버튼)
  await expect(a.locator('.bigscreen-empty')).toBeVisible()

  // Alice가 사진 업로드
  a.on('filechooser', async (fc) => {
    await fc.setFiles({ name: 'pic.png', mimeType: 'image/png', buffer: PNG })
  })
  await a.locator('.bigscreen-empty').click()

  // Alice 본인 스크린에 사진 표시
  await expect(a.locator('.bigscreen img'), 'Alice 스크린에 사진 표시').toBeVisible()
  // Bob의 맵 스크린에도 사진 표시 (전파)
  await expect(b.locator('.bigscreen img'), 'Bob 스크린에도 사진 전파').toBeVisible({ timeout: 10000 })
  await expect(b.locator('.bigscreen-bar'), 'Bob 화면에 공유자 표시').toContainText('Alice')

  // 끄기 → 양쪽 모두 빈 스크린으로
  await a.locator('.bigscreen-bar button[title="끄기"]').click()
  await expect(a.locator('.bigscreen-empty'), 'Alice 스크린 꺼짐(로컬)').toBeVisible()
  await expect(b.locator('.bigscreen-empty'), 'Bob 스크린도 꺼짐(전파)').toBeVisible()

  await ctxA.close()
  await ctxB.close()
})
