import { test, expect } from '@playwright/test'

// Enter / '/' 로 채팅 입력창 포커스

test('Enter 또는 / 로 채팅 포커스', async ({ page }) => {
  await page.goto('/?room=t-kbd')
  await page.locator('.entry input').fill('Typer')
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()

  const activePlaceholder = () => page.evaluate(() => document.activeElement?.getAttribute('placeholder') || '')

  // 바깥(맵) 포커스 상태로 (스테이지 클릭 → body 포커스)
  await page.locator('.stage').click({ position: { x: 6, y: 6 } })

  // Enter → 채팅 입력창 포커스
  await page.keyboard.press('Enter')
  expect(await activePlaceholder(), 'Enter로 채팅 포커스').toContain('메시지')

  // 빈 상태로 Enter 한 번 더 → 채팅 비활성화(포커스 해제)
  await page.keyboard.press('Enter')
  expect(await activePlaceholder(), '빈 Enter로 채팅 비활성화').not.toContain('메시지')

  // 다시 바깥으로 → '/' 로도 포커스
  await page.locator('.stage').click({ position: { x: 6, y: 6 } })
  await page.keyboard.press('/')
  expect(await activePlaceholder(), '/로 채팅 포커스').toContain('메시지')
})
