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
| 별관 | 상단 **🏬 별관** → 중앙 모달에서 **층 선택**(B1 온천·찜질방 / 1F 카페테리아·포장마차 / 2F 게임존·방탈출 / 3F 헬스장 / 4F 펫파크·낮잠방 / RF 캠핑 불멍·야경 BAR). **개인 이동**(다른 사람 화면 안 바뀜), **비상계단**으로 층간 이동, **같은 층 사람만** 서로 보임. **E키 상호작용**(온천/운동/낮잠/주문/미니게임/방탈출), 고양이 NPC·캠프파이어·온천 김 등 동적 효과 |
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
src/
  App.jsx                랜딩 → 로비(방 선택) → 입장 → 사무실 전환
  constants.js           장소(PLACES) 정의: 타일 맵·좌석·화이트보드·스크린
  lib/
    config.js            Supabase·ICE·Groq env 감지
    realtime.js          실시간 추상화 (Supabase broadcast ↔ BroadcastChannel)
    voice.js             근접 음성 (WebRTC + 음량 분석)
    image.js             이미지 압축·Storage 업로드·클립보드
    path.js              BFS 길찾기(클릭/탭 자동 이동)
    room.js              방 ID 생성·링크/코드 파싱·URL 동기화
    ai.js                자비스 — Groq 호출(프록시→직접 폴백)
  hooks/
    useCamera.js         카메라(줌/팔로우/전체보기)
    useProximityVoice.js 근접 음성 연결·음량
    useAiBot.js          자비스 상태·질의응답·공유
  components/
    Landing.jsx          애니메이션 랜딩
    RoomLobby.jsx        방 만들기 / 코드·링크로 입장
    EntryScreen.jsx      닉네임/아바타 선택(랜덤 기본·localStorage 기억)
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
| `VITE_GROQ_API_KEY` (로컬 개발만) | 로컬에서 자비스 직접 호출용. 브라우저 노출되니 운영 금지 |

## 🛠️ 알려진 제약 / 다음 단계

- **음성**: 기본 STUN만 → 위 TURN 설정 시 안정화. 다수 동시 통화는 SFU(LiveKit 등) 권장.
- **이미지/낙서**: 기본은 broadcast로 dataURL 직접 전송(압축). `VITE_SUPABASE_BUCKET` 설정 시 Storage 업로드.
- 방(room)은 `?room=` 쿼리로 분리 — 멀티 오피스 확장 가능.
