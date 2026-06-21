import { test, expect } from '@playwright/test'

// 화이트보드 텍스트 공유 + 감정표현(이모트) + 데스크탑 채팅 레이아웃 검증

async function enter(page, name) {
  await page.goto('/?room=t-feat')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
function peerAvatar(page, name) {
  return page.locator('.avatar:not(.me)', { has: page.locator('.avatar-name', { hasText: name }) })
}

test('화이트보드 · 이모트 · 데스크탑 레이아웃', async ({ browser }) => {
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()
  await enter(a, 'Alice')
  await enter(b, 'Bob')
  await expect(peerAvatar(a, 'Bob')).toBeVisible()

  // 1) 데스크탑: 채팅이 우측 컬럼으로 보이고 사무실(stage)을 가리지 않음
  const stageBox = await a.locator('.stage').boundingBox()
  const chatBox = await a.locator('.chat').boundingBox()
  expect(chatBox, '데스크탑 채팅 보임').not.toBeNull()
  expect(stageBox.x + stageBox.width, '사무실과 채팅이 겹치지 않음').toBeLessThanOrEqual(chatBox.x + 2)

  // 2) 화이트보드: A가 첫 보드에 글 쓰면 B에게 보임
  await a.locator('.whiteboard .wb-text').first().click()
  await a.locator('.whiteboard textarea').first().fill('회의 19시')
  await a.locator('.logo').click() // 바깥 클릭 → blur 저장
  await expect(b.locator('.whiteboard').first(), 'B가 화이트보드 글을 봐야 함').toContainText('회의 19시')

  // 3) 감정표현: A가 이모트 보내면 A·B 양쪽 아바타에 표시
  await a.locator('.emote-btn').click()
  await a.locator('.emote-grid button', { hasText: '👍' }).click()
  await expect(a.locator('.avatar.me .emote'), 'A 본인 이모트 표시').toHaveText('👍')
  await expect(peerAvatar(b, 'Alice').locator('.emote'), 'B가 A 이모트 봐야 함').toHaveText('👍')

  await ctxA.close()
  await ctxB.close()
})
