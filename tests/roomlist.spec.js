import { test, expect } from '@playwright/test'

// 로비의 "열려 있는 방" 리스트에 활성 방이 뜨고, 선택해 입장할 수 있다.
// (방 이름은 공유 lobby 채널을 타므로 병렬 테스트 충돌 방지를 위해 고유 이름 사용)

test('열린 방 리스트에서 선택해 입장', async ({ browser }) => {
  const RN = 'QARoom' + Date.now()

  // A: 방 만들고 입장 → 로비에 beat 광고 시작
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.locator('.landing-cta').click()
  await a.locator('.lobby-block input').first().fill(RN)
  await a.locator('.lobby-btn.primary').click()
  await a.locator('.entry input').fill('Alice')
  await a.locator('.enter-btn').click()
  await a.locator('.notice-ok').click()
  await expect(a.locator('.avatar.me')).toBeVisible()
  const roomId = new URL(a.url()).searchParams.get('room')

  // B: 로비에서 리스트로 그 방 확인 → 클릭 입장
  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto('/')
  await b.locator('.landing-cta').click()
  const item = b.locator('.room-item', { hasText: RN })
  await expect(item, '리스트에 A의 방이 보임').toBeVisible({ timeout: 12000 })
  await item.click()
  await expect(b.locator('.entry')).toBeVisible()
  expect(new URL(b.url()).searchParams.get('room')).toBe(roomId)
  await b.locator('.entry input').fill('Bob')
  await b.locator('.enter-btn').click()
  await b.locator('.notice-ok').click()
  await expect(b.locator('.avatar.me')).toBeVisible()

  // 같은 방 → 서로 보임
  await expect(a.locator('.avatar:not(.me)'), 'A가 B를 봄').toBeVisible({ timeout: 12000 })

  await ctxA.close()
  await ctxB.close()
})
