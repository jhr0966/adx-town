import { useEffect, useState } from 'react'
import { THEMES, getTheme, applyTheme } from '../lib/theme'

// 테마 토글 (Dawn/Dusk/Meadow).
//   variant="float"  — 우상단 고정(랜딩·로비·입장)
//   variant="inline" — 사무실 상단바 안에 배치(겹침 방지)
export default function ThemeSwitcher({ variant = 'float' }) {
  const [theme, setTheme] = useState(getTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  return (
    <div className={'theme-switch ' + variant}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          className={theme === t.id ? 'on' : ''}
          title={t.name}
          aria-label={t.name}
          onClick={() => setTheme(t.id)}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
