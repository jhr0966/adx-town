import { test, expect } from '@playwright/test'

// 방 만들기(고유 URL 생성) + 공유 URL/코드로 입장

async function enterName(page, name) {
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('방 만들기 → 공유 URL로 다른 사람이 같은 방 입장', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.locator('.landing-cta').click() // 랜딩 → 로비
  await expect(a.locator('.lobby')).toBeVisible()
  await a.locator('.lobby-block input').first().fill('테스트룸')
  await a.locator('.lobby-btn.primary').click() // 새 방 만들기 → 입장 화면

  await expect(a.locator('.entry')).toBeVisible()
  const url = a.url()
  expect(url, 'URL에 고유 방 코드가 생성됨').toContain('room=')
  await enterName(a, 'Alice')

  // B: A가 공유한 전체 URL로 접속 → 랜딩/로비 건너뛰고 바로 입장 화면
  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto(url)
  await expect(b.locator('.entry')).toBeVisible()
  await expect(b.locator('.landing')).toHaveCount(0)
  await enterName(b, 'Bob')

  // 같은 방 → 서로의 아바타가 보임
  await expect(a.locator('.avatar:not(.me)'), 'A가 B를 봄').toBeVisible({ timeout: 12000 })
  await expect(b.locator('.avatar:not(.me)'), 'B가 A를 봄').toBeVisible({ timeout: 12000 })

  await ctxA.close()
  await ctxB.close()
})

test('기존 방 코드로 입장', async ({ browser }) => {
  // A가 방을 만들고 코드 추출
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.locator('.landing-cta').click()
  await a.locator('.lobby-btn.primary').click() // 이름 없이 랜덤 방
  await expect(a.locator('.entry')).toBeVisible()
  const code = new URL(a.url()).searchParams.get('room')
  await enterName(a, 'Host')

  // B: 로비의 "코드·링크로 입장"에 코드 입력
  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto('/')
  await b.locator('.landing-cta').click()
  const joinForm = b.locator('.lobby-block', { has: b.locator('input[placeholder*="코드"]') })
  await joinForm.locator('input').fill(code)
  await joinForm.locator('.lobby-btn').click()
  await expect(b.locator('.entry')).toBeVisible()
  expect(new URL(b.url()).searchParams.get('room')).toBe(code)
  await enterName(b, 'Guest')

  await expect(a.locator('.avatar:not(.me)')).toBeVisible({ timeout: 12000 })
  await expect(b.locator('.avatar:not(.me)')).toBeVisible({ timeout: 12000 })

  await ctxA.close()
  await ctxB.close()
})

test('초대 링크 복사 버튼', async ({ browser }) => {
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
  const p = await ctx.newPage()
  await p.goto('/?room=t-invite')
  await enterName(p, 'Sharer')
  await p.locator('.invite-btn').click()
  await expect(p.locator('.invite-btn')).toContainText('복사됨')
  const copied = await p.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('room=t-invite')
  await ctx.close()
})
