// 개인 설정(닉네임·아바타·테마) 저장소.
//
// TEAM 스토어는 앱의 localStorage 를 팀 전체에 공유(서버 DB 로 동기화)한다.
// 개인 취향까지 공유되면 남의 설정을 덮어쓰므로, 스토어 빌드에서는 sessionStorage(탭 단위)에 둔다.
// 일반 빌드(Vercel 등)는 지금처럼 localStorage 에 기억한다.
import { TEAM_STORE } from './config'

function store() {
  try {
    return TEAM_STORE ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

export function getPref(key) {
  try { return store()?.getItem(key) ?? null } catch { return null }
}

export function setPref(key, value) {
  try { store()?.setItem(key, value) } catch {}
}
