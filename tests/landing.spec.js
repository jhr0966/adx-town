import { test, expect } from '@playwright/test'

test('랜딩 페이지 → 입장', async ({ page }) => {
  await page.goto('/')
  // 랜딩이 보이고 ADX TOWN 타이틀 표시
  await expect(page.locator('.landing-title')).toBeVisible()
  await expect(page.locator('.landing-title')).toContainText('ADX')
  await expect(page.locator('.entry')).toHaveCount(0)

  // 입장하기 → 방 로비 → 새 방 만들기 → 닉네임 화면
  await page.locator('.landing-cta').click()
  await expect(page.locator('.lobby')).toBeVisible()
  await page.locator('.lobby-btn.primary').click()
  await expect(page.locator('.entry')).toBeVisible()
  await expect(page.locator('.entry-card h1')).toContainText('캐릭터를 꾸며 주세요')
  await expect(page).toHaveURL(/room=/) // 고유 방 URL 발급
})

test('방 링크(?room=)는 랜딩·로비 건너뜀', async ({ page }) => {
  await page.goto('/?room=t-landing')
  await expect(page.locator('.entry')).toBeVisible()
  await expect(page.locator('.landing')).toHaveCount(0)
  await expect(page.locator('.lobby')).toHaveCount(0)
})
