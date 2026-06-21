import { test, expect } from '@playwright/test'

// 두 명의 사용자가 서로를 보고, 이동·채팅이 양방향으로 동기화되는지 검증

async function enter(page, name) {
  await page.goto('/?room=t-sync')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  // 환영 공지 닫기
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

function peerAvatar(page, name) {
  // 상대방 아바타: .avatar(자기자신 .me 제외) 안에 해당 닉네임 라벨
  return page.locator('.avatar:not(.me)', { has: page.locator('.avatar-name', { hasText: name }) })
}

function chatInput(page) {
  return page.locator('.chat-input input[placeholder*="메시지"]')
}

// 맵 내부 좌표(스크롤 영향 없음)
const posOf = (loc) => loc.evaluate((el) => ({ x: el.offsetLeft, y: el.offsetTop }))

test('두 사용자 동기화: 아바타·이동·채팅', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()

  a.on('console', (m) => console.log('[A]', m.text()))
  b.on('console', (m) => console.log('[B]', m.text()))

  await enter(a, 'Alice')
  await enter(b, 'Bob')

  // 1) 서로의 아바타가 보이는가
  await expect(peerAvatar(a, 'Bob'), 'Alice가 Bob 아바타를 봐야 함').toBeVisible()
  await expect(peerAvatar(b, 'Alice'), 'Bob이 Alice 아바타를 봐야 함').toBeVisible()

  // 2) Alice가 이동하면 (자기 화면 + Bob 화면) Alice 아바타가 움직이는가
  const aliceOnA = a.locator('.avatar.me')
  const aliceOnB = peerAvatar(b, 'Alice')
  const selfBefore = await posOf(aliceOnA)
  const before = await posOf(aliceOnB)
  await a.locator('.stage').click({ position: { x: 5, y: 5 } }) // 입력창 밖 포커스
  await a.keyboard.press('ArrowRight')
  await a.keyboard.press('ArrowRight')
  await a.waitForTimeout(500)
  const selfAfter = await posOf(aliceOnA)
  await b.waitForTimeout(2000)
  const after = await posOf(aliceOnB)
  console.log('Alice on OWN screen:', selfBefore.x, '->', selfAfter.x)
  console.log('Alice on B screen:', before.x, '->', after.x)
  expect(selfAfter.x, 'Alice 자기 화면에서 본인이 이동해야 함(키입력)').toBeGreaterThan(selfBefore.x + 10)
  expect(after.x, 'Bob 화면에서 Alice가 오른쪽으로 이동해야 함').toBeGreaterThan(before.x + 10)

  // 3) Bob이 이동하면 Alice 화면에서 Bob 아바타가 움직이는가
  const bobOnA = peerAvatar(a, 'Bob')
  const bBefore = await posOf(bobOnA)
  await b.locator('.stage').click({ position: { x: 5, y: 5 } })
  await b.keyboard.press('ArrowDown')
  await b.keyboard.press('ArrowDown')
  await a.waitForTimeout(2000)
  const bAfter = await posOf(bobOnA)
  console.log('Bob on A:', bBefore.y, '->', bAfter.y)
  expect(bAfter.y, 'Alice 화면에서 Bob이 아래로 이동해야 함').toBeGreaterThan(bBefore.y + 10)

  // 4) 채팅 양방향
  await chatInput(a).fill('hello-from-alice')
  await chatInput(a).press('Enter')
  await expect(b.locator('.chat-list'), 'Bob이 Alice 채팅을 봐야 함').toContainText('hello-from-alice')

  await chatInput(b).fill('hello-from-bob')
  await chatInput(b).press('Enter')
  await expect(a.locator('.chat-list'), 'Alice가 Bob 채팅을 봐야 함').toContainText('hello-from-bob')

  await ctxA.close()
  await ctxB.close()
})
