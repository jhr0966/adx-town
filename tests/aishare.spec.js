import { test, expect } from '@playwright/test'

// 내 자비스를 공유하면 다른 사람에게도 보임

async function enter(page, name) {
  await page.goto('/?room=t-aishare')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('자비스 공유 → 상대 화면에도 표시', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await a.route('**/api/groq', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: '회의는 3시입니다.' }) }),
  )
  await enter(a, 'Owner')
  await enter(b, 'Mate')
  await expect(b.locator('.avatar:not(.me)')).toBeVisible() // 서로 접속

  // B는 처음엔 자비스가 안 보임
  await expect(b.locator('.avatar.aibot')).toHaveCount(0)

  // A: 자비스 호출 + 공유 켜기
  await a.locator('.tool-dock button[title*="자비스"]').click()
  await expect(a.locator('.avatar.aibot')).toBeVisible()
  await a.locator('.ai-share').click()
  await expect(a.locator('.ai-share')).toHaveText(/공유중/)

  // B 화면에도 A의 자비스가 나타남
  await expect(b.locator('.avatar.aibot'), 'B가 A의 자비스를 봐야 함').toBeVisible({ timeout: 10000 })

  // A가 질문 → 답변 말풍선이 B에게도 전파
  await a.locator('.ai-input input').fill('회의 언제야?')
  await a.locator('.ai-input input').press('Enter')
  await expect(b.locator('.avatar.aibot .bot-bubble'), 'B가 자비스 답변 말풍선을 봐야 함').toContainText('회의는 3시', { timeout: 10000 })

  // A가 공유 끄면 B에게서 사라짐
  await a.locator('.ai-share').click()
  await expect(b.locator('.avatar.aibot'), '공유 끄면 사라짐').toHaveCount(0, { timeout: 10000 })

  await ctxA.close()
  await ctxB.close()
})
