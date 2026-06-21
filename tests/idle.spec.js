import { test, expect } from '@playwright/test'

// 두 사용자가 아무것도 안 하고 가만히 있을 때 연결(presence)이 유지되는지 검증
// → "가만히 있다가 친구가 나갔습니다 뜨고 사라짐" 증상 재현

// 실행마다 고유 방 — 이전 실행의 좀비 연결(grace 정리 중)이 간섭하지 않게
const ROOM = 't-idle-' + Date.now()
async function enter(page, name) {
  await page.goto('/?room=' + ROOM)
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}
function peerAvatar(page, name) {
  return page.locator('.avatar:not(.me)', { has: page.locator('.avatar-name', { hasText: name }) })
}

test('가만히 있어도 연결 유지 (45초)', async ({ browser }) => {
  test.setTimeout(120000)
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await ctxA.newPage()
  const b = await ctxB.newPage()

  await enter(a, 'Alice')
  await enter(b, 'Bob')
  await expect(peerAvatar(a, 'Bob')).toBeVisible()
  await expect(peerAvatar(b, 'Alice')).toBeVisible()

  // 45초 동안 5초 간격으로 서로의 아바타가 계속 보이는지 + "나갔습니다" 안 뜨는지 확인
  for (let t = 5; t <= 60; t += 5) {
    await a.waitForTimeout(5000)
    const bobVisible = await peerAvatar(a, 'Bob').isVisible()
    const aliceVisible = await peerAvatar(b, 'Alice').isVisible()
    const leftMsgA = await a.locator('.msg-system', { hasText: '나갔' }).count()
    const leftMsgB = await b.locator('.msg-system', { hasText: '나갔' }).count()
    console.log(`${t}s: A sees Bob=${bobVisible}, B sees Alice=${aliceVisible}, leaveMsg A=${leftMsgA} B=${leftMsgB}`)
    expect(bobVisible, `${t}s: Alice가 Bob을 계속 봐야 함`).toBe(true)
    expect(aliceVisible, `${t}s: Bob이 Alice를 계속 봐야 함`).toBe(true)
    expect(leftMsgA + leftMsgB, `${t}s: "나갔습니다"가 뜨면 안 됨`).toBe(0)
  }

  await ctxA.close()
  await ctxB.close()
})
