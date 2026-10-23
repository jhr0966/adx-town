import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드 모드
//   - (기본)      Vercel/일반 호스팅: AI 는 /api/groq 서버리스 프록시 우선
//   - teamstore   TEAM 스토어용: 서버 코드 없이 정적 파일만. `npm run build:store`
export default defineConfig(({ mode }) => {
  const teamStore = mode === 'teamstore'
  return {
    plugins: [react()],
    // 상대 경로 빌드 — 어떤 하위 경로(예: http://서버/앱이름/)에 올려도 동작
    base: './',
    define: {
      __TEAM_STORE__: JSON.stringify(teamStore),
      // TEAM 스토어는 자체 서버가 없으므로 프록시 경로를 비워 둔다(직접 호출 + 팀 공용 API 키)
      __AI_PROXY__: JSON.stringify(teamStore ? '' : '/api/groq'),
    },
    build: {
      rollupOptions: {
        output: {
          // 벤더를 분리해 캐싱 효율 ↑ (앱 코드만 바뀌면 vendor 청크 재다운로드 불필요)
          manualChunks: {
            react: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  }
})
