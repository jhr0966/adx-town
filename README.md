# 🏢 ADX 타운 (ADX Town)

게더타운 스타일의 웹 가상 사무실. 같은 페이지에 접속한 사람들이 닉네임·아바타를 정하고
격자 맵 위를 돌아다니며 **실시간 채팅·근접 음성·화면 공유·화이트보드·커서 공유**로 함께 일합니다.

- **프론트엔드**: React + Vite (→ Vercel 배포)
- **실시간**: Supabase Realtime (broadcast 기반)
- **음성**: WebRTC P2P (근접 3칸)
- **검증**: Playwright 멀티-브라우저 E2E 12종

---

## ✨ 기능

| 분류 | 기능 |
|------|------|
| 입장 | 애니메이션 랜딩 → **방 만들기/입장 로비** → 닉네임·아바타(이모지)·색상 선택(첫 접속 랜덤 기본), 지난 설정 기억 |
| 방 | **새 방 생성 시 고유 URL 발급 → 링크 공유로 같은 방 입장**, **열려 있는 방 리스트에서 선택 입장**(인원수 표시), 코드·링크 입장, 상단 **🔗 초대**(링크 복사/공유). 방은 **모두 나가면 1분 뒤 자동 소멸** |
| 이동 | 격자 이동(방향키·WASD·모바일 D패드), **클릭/탭 자동 이동(길찾기)**, 카메라 확대/추적, 단계별 줌, 전체보기 |
| 장소 | **사무실** / **대회의실** 이동(참석자 전원 함께 이동) |
| 대화 | 텍스트 채팅(머리 위 말풍선), 입·퇴장 알림, 안읽음 뱃지, 채팅창 토글/최소화, `/`·Enter 포커스 |
| 음성 | **근접 음성(3칸 이내 자동 연결, 멀어지면 끊김)** + 말하는 음량 게이지 |
| 공유 | 대형 스크린에 사진 업로드(파일·**클립보드 붙여넣기/Ctrl+V**·**드래그앤드랍**) + **사진 위 낙서** + 풀스크린(낙서 동기화) |
| 스킬 | **돌 던지기** — 클릭한 칸으로 돌 투척, 맞으면 **1초 기절(이동 불가)**, 1초 쿨다운 |
| 협업 | 그룹별 **화이트보드**(텍스트 즉시 공유), **마우스 커서 공유**(PC·모바일 스와이프) |
| 감정 | 이모지 감정표현(머리 위로), **PC 하단 이모지 바** |
| 확성기 | **전체 공지 전광판**(위치 무관 마퀴 표시) |
| AI | **자비스(Groq LLM) 호출** — 옆에 봇 소환, 채팅 이력 컨텍스트 Q&A, 답변 말풍선, **다른 사람에게 공유** |
| UI | 좌측 세로 **플로팅 도구 바**(음성/확성기/커서/자비스/돌던지기/전체보기), 모바일·가로모드 최적화, 다크 UI |

## 🚀 빠른 시작 (로컬, Supabase 불필요)

```bash
npm install
npm run dev      # http://localhost:5173
```

같은 브라우저의 **새 탭**을 열어 다른 닉네임으로 입장하면 두 캐릭터가 서로 보입니다
(`BroadcastChannel` 로컬 모드 — 탭 간만 통신).

> 다른 기기/사람과 연결하려면 아래 Supabase 설정이 필요합니다.

## 🌐 온라인 모드 (Supabase)

1. [supabase.com](https://supabase.com) 무료 프로젝트 생성
2. **Project Settings → API** 에서 `Project URL` 과 `publishable` 키 복사
3. `.env.example` → `.env` 복사 후 입력:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
4. `npm run dev` 재시작 → 자동으로 온라인 모드

DB 테이블·SQL 불필요 (위치·채팅·시그널링이 모두 Realtime broadcast로 동작).
키가 없으면 [src/lib/config.js](src/lib/config.js)의 기본값으로 폴백합니다.

## ☁️ Vercel 배포

```bash
npm run build
vercel --prod --token=YOUR_TOKEN   # 로그인 버그 회피용 토큰 방식
```

- Framework: **Vite** 자동 감지 (build `vite build`, output `dist`)
- 배포 후 **Deployment Protection → Vercel Authentication 끄기** (안 끄면 친구가 401)
- 배포·갱신 후 **Ctrl + Shift + R** 강력 새로고침

## 🏬 TEAM 스토어에 올리기 (사내 공용 서버)

TEAM 스토어(사내 정적 웹 서버)용 빌드는 **서버 코드 없이 정적 파일만**으로 동작하도록 따로 만든다.

```bash
npm run package:store      # = vite build --mode teamstore + ZIP 생성 (+ 올리기 전 자체 점검)
# → adx-town-teamstore.zip  (index.html 이 맨 위, 약 0.2MB)
```

1. 스토어 **+ 앱 올리기** → `adx-town-teamstore.zip` 선택 (앱 이름은 `<title>` 의 "ADX 타운"이 제안됨)
2. 자비스(AI)를 쓰려면 스토어 **관리 화면 → 팀 공용 API 키**에 등록
   - API 주소: `https://api.groq.com`
   - 키: Groq API 키 (서버 PC 에만 저장되고 팀원 브라우저로는 가지 않음)
   - 앱이 키를 보관하는 이름: `apiKey`
3. 팀원은 `http://서버IP:포트/앱이름/` 으로 접속. 방 링크(`?room=…`)도 그대로 동작

**일반 빌드(`npm run build`, Vercel)와 다른 점**

| 항목 | 일반 빌드 | TEAM 스토어 빌드(`--mode teamstore`) |
|---|---|---|
| AI 호출 | `/api/groq` 서버리스 프록시 → 직접 호출 폴백 | 프록시 없음. Groq 원주소로 직접 호출, 스토어가 팀 공용 키를 붙여 줌 (`window.TEAM_SHARED_API`). 없으면 `localStorage.apiKey` |
| 닉네임·아바타·테마 기억 | `localStorage` | `sessionStorage` (스토어의 `localStorage` 는 팀 전체에 공유되므로 개인 설정을 넣지 않음) |
| 공통 | 상대 경로(`./assets/…`), 폰트 자체 포함(`src/fonts/`), 외부 CDN 없음, Supabase 세션 미저장 | |

**사내망에서 꼭 확인할 것**

- **실시간 동기화는 Supabase Realtime(인터넷)을 쓴다.** 팀원 PC 에서 `https://*.supabase.co` 와 `wss://*.supabase.co` 가 열려 있어야 서로 보인다. 막혀 있으면 화면 상단에 "⚠️ 서버 연결 안 됨" 칩이 뜨고 나만 보인다. (스토어의 localStorage 브릿지는 초당 수십 건의 위치 동기화에 맞지 않아 대체하지 않았다)
- **근접 음성은 `http://` 에서 꺼진다.** 브라우저가 비보안 주소에서 마이크 API 를 막기 때문. 버튼을 누르면 안내만 나온다. 꼭 필요하면 Chrome 의 `chrome://flags/#unsafely-treat-insecure-origin-as-secure` 에 스토어 주소를 등록한다.
- 스토어의 올리기 전 검사에서 `/api/broadcast` 경고가 나올 수 있다. Supabase 라이브러리가 Supabase 호스트 뒤에 붙이는 경로이며 자체 서버 호출이 아니므로 무시해도 된다.

## 🧪 테스트 (브라우저 2개 자동 검증)

```bash
npm test          # Playwright E2E 전체
```

| 테스트 | 검증 내용 |
|--------|-----------|
| `sync` | 입장·이동·채팅 양방향 |
| `idle` | 60초 유지(헛 퇴장 없음) |
| `stress` | 연속 이동 폭주 후 동기화 |
| `screen` | 대형 스크린 사진 공유·전파·끄기 |
| `features` | 화이트보드·이모트·PC 레이아웃 |
| `mobile` | D패드·채팅 토글·안읽음 뱃지 |
| `place` | 장소 이동 다같이 + 전체보기 |
| `cursor` | PC 커서 공유 |
| `voice` | 근접 음성 연결/해제 + 마이크 게이지 |
| `landing` | 랜딩 → 입장, 방링크 건너뜀 |
| `move` | 클릭/탭 자동 이동(PC·모바일) |
| `megaphone` | 확성기 → 전체 전광판 |
| `emotebar` | PC 이모지 바 / 모바일 숨김 |
| `fullscreen` | 스크린 풀스크린 + 낙서 동기화 |
| `paste`·`drop` | 클립보드 붙여넣기 / 드래그앤드랍 스크린 공유 |
| `uimobile`·`landscape` | 모바일/가로모드 레이아웃(겹침 방지) |
| `keyboard` | `/`·Enter 채팅 포커스 |
| `room` | 방 만들기→공유 URL 입장, 코드 입장, 초대 링크 복사 |
| `roomlist` | 로비의 열린 방 리스트에 표시 → 선택 입장 |
| `rock` | 돌 던지기 → 명중 시 기절·이동 차단, 빗나감 |
| `ai`·`aishare` | 자비스 Q&A·채팅 컨텍스트·공유 (Groq 프록시 모킹) |

테스트는 `?room=<id>`로 방을 분리해 서로 간섭하지 않습니다. WebRTC·외부 API(Groq)는
가짜 미디어·route 모킹으로 검증합니다.

## 📁 구조

```
api/
  groq.js                Vercel 서버리스 — Groq 프록시(키 비노출)
scripts/
  package-store.mjs      TEAM 스토어용 ZIP 생성 + 올리기 전 자체 점검
src/
  fonts/                 자체 포함 웹폰트(Fredoka·Plus Jakarta Sans, OFL)
  App.jsx                랜딩 → 로비(방 선택) → 입장 → 사무실 전환
  constants.js           장소(PLACES) 정의: 타일 맵·좌석·화이트보드·스크린
  lib/
    config.js            Supabase·ICE·Groq env 감지, 빌드 모드(TEAM_STORE)
    realtime.js          실시간 추상화 (Supabase broadcast ↔ BroadcastChannel)
    voice.js             근접 음성 (WebRTC + 음량 분석)
    image.js             이미지 압축·Storage 업로드·클립보드
    path.js              BFS 길찾기(클릭/탭 자동 이동)
    room.js              방 ID 생성·링크/코드 파싱·URL 동기화
    ai.js                자비스 — Groq 호출(프록시→직접 폴백, 스토어 공용 키 지원)
    prefs.js             개인 설정 저장소(일반: localStorage / 스토어 빌드: sessionStorage)
  hooks/
    useCamera.js         카메라(줌/팔로우/전체보기)
    useProximityVoice.js 근접 음성 연결·음량
    useAiBot.js          자비스 상태·질의응답·공유
  components/
    Landing.jsx          애니메이션 랜딩
    RoomLobby.jsx        방 만들기 / 코드·링크로 입장
    EntryScreen.jsx      닉네임/아바타 선택(랜덤 기본·개인 설정 기억)
    Office.jsx           메인: 방·이동·카메라·렌더 오케스트레이션
    Chat.jsx             채팅 + 사진 + 감정표현 버튼
    office/              프레젠테이션 컴포넌트(메모)
      MapFloor·Avatar·Cursor·Whiteboard·LargeScreen·DPad·EmotePicker·Rock
      Megaphone·EmoteBar·ScreenLightbox·AiBot·AiPanel·WelcomeNotice
```

자세한 설계는 [ARCHITECTURE.md](ARCHITECTURE.md) 참고.

## ⚙️ 선택 설정 (.env)

| 변수 | 효과 |
|------|------|
| `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL` | 음성 TURN 서버 추가 (까다로운 NAT/방화벽 안정화). 없으면 STUN만 |
| `VITE_SUPABASE_BUCKET` | 이미지를 Supabase Storage(public 버킷)에 업로드 후 URL 공유. 없으면 압축 dataURL 직접 전송 |
| `GROQ_API_KEY` (서버 전용, Vercel 환경변수) | **자비스** AI 응답. `api/groq.js` 프록시가 사용 — 브라우저 비노출 |
| (TEAM 스토어) 관리 화면의 팀 공용 API 키 | 주소 `https://api.groq.com` + 키, 보관 이름 `apiKey`. 위 🏬 절 참고 |
| `VITE_GROQ_API_KEY` (로컬 개발만) | 로컬에서 자비스 직접 호출용. 브라우저 노출되니 운영 금지 |

## 🛠️ 알려진 제약 / 다음 단계

- **음성**: 기본 STUN만 → 위 TURN 설정 시 안정화. 다수 동시 통화는 SFU(LiveKit 등) 권장.
- **이미지/낙서**: 기본은 broadcast로 dataURL 직접 전송(압축). `VITE_SUPABASE_BUCKET` 설정 시 Storage 업로드.
- 방(room)은 `?room=` 쿼리로 분리 — 멀티 오피스 확장 가능.
