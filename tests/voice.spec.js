import { test, expect } from '@playwright/test'

// 근접 음성: 3칸 이내 접근 시 연결(표시), 멀어지면 끊김

async function enter(page, name) {
  await page.goto('/?room=t-voice')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
function peerAvatar(page, name) {
  return page.locator('.avatar:not(.me)', { has: page.locator('.avatar-name', { hasText: name }) })
}

test('근접 음성 연결/해제', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Alice')
  await enter(b, 'Bob')
  await expect(peerAvatar(a, 'Bob')).toBeVisible()

  // 둘 다 음성 켜기 (시작 위치가 같아 거리 0 → 연결되어야 함)
  await a.locator('.tool-dock button[title*="음성"]').click()
  await b.locator('.tool-dock button[title*="음성"]').click()

  // 서로 음성 연결 표시(.avatar.voice)가 떠야 함
  await expect(peerAvatar(a, 'Bob'), 'A가 Bob과 음성 연결').toHaveClass(/voice/, { timeout: 10000 })
  await expect(peerAvatar(b, 'Alice'), 'B가 Alice와 음성 연결').toHaveClass(/voice/, { timeout: 10000 })

  // 마이크 게이지가 캐릭터 옆에 표시됨
  await expect(peerAvatar(a, 'Bob').locator('.mic-gauge'), '마이크 게이지 표시').toBeVisible()

  // A가 멀리 이동(3칸 초과) → 연결 끊김
  await a.locator('.stage').click({ position: { x: 5, y: 5 } })
  for (let i = 0; i < 6; i++) await a.keyboard.press('ArrowDown')
  await expect(peerAvatar(a, 'Bob'), '멀어지면 음성 끊김(A)').not.toHaveClass(/voice/, { timeout: 10000 })
  await expect(peerAvatar(b, 'Alice'), '멀어지면 음성 끊김(B)').not.toHaveClass(/voice/, { timeout: 10000 })

  await ctxA.close()
  await ctxB.close()
})
