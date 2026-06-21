import { test, expect } from '@playwright/test'

// 확성기: 켜서 메시지 보내면 위치 무관 전체에게 전광판으로 표시

async function enter(page, name) {
  await page.goto('/?room=t-mega')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('확성기 → 전체 전광판', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Boss')
  await enter(b, 'Bob')
  await expect(b.locator('.avatar:not(.me)')).toBeVisible() // 서로 접속 확인

  // 좌측 플로팅 도구(음성/확성기/커서/자비스/돌던지기/전체보기)
  await expect(a.locator('.tool-dock .tool')).toHaveCount(6)

  // 확성기 켜고 메시지 전송
  await a.locator('.tool-dock button[title*="확성기"]').click()
  await expect(a.locator('.mega-pop')).toBeVisible()
  await a.locator('.mega-pop input').fill('전체 회의 3시에 시작합니다')
  await a.locator('.mega-pop input').press('Enter')

  // 보낸 사람·받는 사람 모두 전광판 표시
  await expect(a.locator('.announce-bar'), '보낸 사람도 전광판 표시').toContainText('전체 회의 3시에 시작합니다')
  await expect(b.locator('.announce-bar'), 'B도 위치 무관 전광판 표시').toContainText('전체 회의 3시에 시작합니다')
  await expect(b.locator('.announce-bar')).toContainText('Boss')

  await ctxA.close()
  await ctxB.close()
})
