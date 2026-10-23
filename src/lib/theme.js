// 테마 (Dawn / Dusk / Meadow) — html[data-theme]로 토큰 전환, 개인 설정 저장소(prefs)에 기억.
import { getPref, setPref } from './prefs'

const KEY = 'adxtown:theme'

export const THEMES = [
  { id: 'dawn', icon: '☀️', name: 'Dawn', meta: '#f4ece2' },
  { id: 'dusk', icon: '🌙', name: 'Dusk', meta: '#181423' },
  { id: 'meadow', icon: '🌿', name: 'Meadow', meta: '#eef3e9' },
]

export function getTheme() {
  try {
    const t = getPref(KEY)
    if (t && THEMES.some((x) => x.id === t)) return t
  } catch {}
  return 'dawn'
}

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0]
  document.documentElement.dataset.theme = theme.id
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.meta)
  setPref(KEY, theme.id)
}
