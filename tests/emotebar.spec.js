import { test, expect } from '@playwright/test'

async function enter(page, name) {
  await page.goto('/?room=t-emotebar')
  await page.locator('.entry input').fill(name)
  await page.locator('.enter-btn').click()
  await page.locator('.notice-ok').click()
  await expect(page.locator('.avatar.me')).toBeVisible()
}

test('PC 하단 이모지 바 → 클릭하면 바로 감정표현', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const a = await ctx.newPage()
  await enter(a, 'Emojer')

  await expect(a.locator('.emote-bar')).toBeVisible()
  await expect(a.locator('.emote-bar button')).toHaveCount(12)

  await a.locator('.emote-bar button', { hasText: '🎉' }).click()
  await expect(a.locator('.avatar.me .emote')).toHaveText('🎉')

  await ctx.close()
})

test('모바일에서는 하단 이모지 바 숨김', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const m = await ctx.newPage()
  await enter(m, 'MobUser')
  await expect(m.locator('.emote-bar')).toBeHidden()
  await ctx.close()
})
