// TEAM 스토어 업로드용 ZIP 만들기 — `npm run package:store`
// dist/ (vite build --mode teamstore 결과) 를 index.html 이 맨 위에 오도록 압축한다.
// 결과: adx-town-teamstore.zip (저장소 루트). 스토어의 "+ 앱 올리기"에 이 파일을 올리면 된다.
import { existsSync, rmSync, statSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = resolve(new URL('..', import.meta.url).pathname)
const dist = resolve(root, 'dist')
const out = resolve(root, 'adx-town-teamstore.zip')

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('dist/index.html 이 없습니다. 먼저 `npm run build:store` 를 실행하세요.')
  process.exit(1)
}

// 올리기 전 자체 점검 (TEAM 스토어 지침 6장)
const problems = []
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(resolve(d, e.name)) : [resolve(d, e.name)])
for (const f of walk(dist)) {
  if (!/\.(html|js|css)$/.test(f)) continue
  const s = readFileSync(f, 'utf8')
  const rel = f.slice(dist.length + 1)
  if (/https?:\/\/[^"'` ]*(cdn|fonts\.googleapis|fonts\.gstatic|unpkg|jsdelivr)/i.test(s)) problems.push(`${rel}: 외부 CDN 주소가 남아 있음`)
  // 자체 서버 호출(fetch('/api/...')). supabase-js 안의 '/api/broadcast' 는 Supabase 호스트에 붙는 경로라 제외.
  if (/fetch\(\s*["'`]\//.test(s) || /["'`]\/api\/groq/.test(s)) problems.push(`${rel}: 자체 서버 경로 '/api/...' 호출이 남아 있음`)
  if (/localStorage\.clear\(/.test(s)) problems.push(`${rel}: localStorage.clear() 사용`)
  if (/Content-Security-Policy/i.test(s)) problems.push(`${rel}: CSP meta 태그가 있음`)
  if (rel === 'index.html' && /(src|href)="\//.test(s)) problems.push(`${rel}: 절대 경로(/...) 참조가 있음 — vite base 가 './' 인지 확인`)
}
if (problems.length) {
  console.error('자체 점검에서 문제가 발견돼 ZIP 을 만들지 않았습니다:\n - ' + problems.join('\n - '))
  process.exit(1)
}

if (existsSync(out)) rmSync(out)
if (process.platform === 'win32') {
  execFileSync('powershell', ['-NoProfile', '-Command',
    `Compress-Archive -Path '${dist}\\*' -DestinationPath '${out}'`], { stdio: 'inherit' })
} else {
  execFileSync('zip', ['-r', '-q', out, '.'], { cwd: dist, stdio: 'inherit' })
}
const mb = (statSync(out).size / 1024 / 1024).toFixed(2)
console.log(`✅ ${out} (${mb} MB) — TEAM 스토어 "+ 앱 올리기"에 올리세요. (한도 64MB)`)
