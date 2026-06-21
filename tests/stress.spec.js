import { test, expect } from '@playwright/test'

// 빠른 연속 이동(방향키 길게 누름) 후에도 동기화가 계속 되는지 검증
// → "몇 초 후 멈춤" 증상 재현

async function enter(page, name) {
  await page.goto('/?room=t-stress')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

function peerAvatar(page, name) {
  return page.locator('.avatar:not(.me)', { has: page.locator('.avatar-name', { hasText: name }) })
}
function chatInput(page) {
  return page.locator('.chat-input input[placeholder*="메시지"]')
}

test('연속 이동 후에도 동기화 유지', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  b.on('console', (m) => { if (m.text().includes('error') || m.text().includes('CHANNEL')) console.log('[B]', m.text()) })

  await enter(a, 'Alice')
  await enter(b, 'Bob')
  await expect(peerAvatar(b, 'Alice')).toBeVisible()

  // Alice가 방향키를 빠르게 연타 (좌우 왕복) — 실제로 길게 누르는 상황
  await a.locator('.stage').click({ position: { x: 5, y: 5 } })
  for (let i = 0; i < 40; i++) {
    await a.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft')
    await a.waitForTimeout(40) // ~25/초
  }

  // 폭주 후 잠시 대기 (연결이 죽는지 확인)
  await a.waitForTimeout(3000)

  // 폭주 이후에도 이동이 Bob에게 전파되는가?
  const aliceOnB = peerAvatar(b, 'Alice')
  const posOf = (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop }))
  const before = await posOf(aliceOnB)
  await a.keyboard.press('ArrowDown')
  await a.keyboard.press('ArrowDown')
  await b.waitForTimeout(2500)
  const after = await posOf(aliceOnB)
  console.log('폭주 후 Alice on B:', before.y, '->', after.y)
  expect(after.y, '폭주 후에도 이동이 전파돼야 함').toBeGreaterThan(before.y + 10)

  // 폭주 이후에도 채팅이 전파되는가?
  await chatInput(a).fill('after-burst-msg')
  await chatInput(a).press('Enter')
  await expect(b.locator('.chat-list'), '폭주 후에도 채팅이 전파돼야 함').toContainText('after-burst-msg')

  await ctxA.close()
  await ctxB.close()
})
