import { test, expect } from '@playwright/test'

// AI 봇 호출 + 질의응답 + 사무실 채팅 이력을 컨텍스트로 사용 (Groq 프록시 모킹)

test('AI 봇 호출 + 채팅 이력 컨텍스트 + 질의응답', async ({ page }) => {
  let lastBody = ''
  await page.route('**/api/groq', async (route) => {
    lastBody = route.request().postData() || ''
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: '방금 "점심 뭐 먹지" 라고 하셨어요!' }),
    })
  })

  await page.goto('/?room=t-ai')
  await page.locator('.entry input').fill('Asker')
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()

  // 먼저 사무실 채팅에 메시지 남김
  await page.locator('.chat-input input[placeholder*="메시지"]').fill('점심 뭐 먹지')
  await page.locator('.chat-input input[placeholder*="메시지"]').press('Enter')
  await expect(page.locator('.chat-list')).toContainText('점심 뭐 먹지')

  // AI 봇 호출
  await page.locator('.tool-dock button[title*="자비스"]').click()
  await expect(page.locator('.avatar.aibot')).toBeVisible()
  await expect(page.locator('.ai-panel')).toBeVisible()

  // 질문 → 응답
  await page.locator('.ai-input input').fill('방금 내가 뭐라고 했어?')
  await page.locator('.ai-input input').press('Enter')
  await expect(page.locator('.ai-msg.assistant').last()).toContainText('점심 뭐 먹지')

  // AI 요청 본문에 채팅 이력이 컨텍스트로 포함됐는지
  expect(lastBody, '채팅 이력이 AI 컨텍스트에 포함').toContain('점심 뭐 먹지')

  await page.locator('.ai-close').click()
  await expect(page.locator('.ai-panel')).toHaveCount(0)
})
