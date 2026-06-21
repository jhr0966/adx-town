# ADX 타운 — 아키텍처

## 개요

순수 클라이언트(React) + Supabase Realtime로 동작하는 P2P 성격의 가상 오피스.
**전용 백엔드 서버가 없다.** 모든 상태는 클라이언트가 들고, Realtime 채널의 broadcast로 동기화한다.

```
┌─────────────┐     broadcast(이동·채팅·시그널링 등)     ┌─────────────┐
│  Client A   │ ───────────────────────────────────────▶ │  Client B   │
│ React + WebRTC                Supabase Realtime          React + WebRTC│
└─────┬───────┘ ◀─────────────────────────────────────── └──────┬──────┘
      │                  WebRTC P2P 오디오 (음성)                  │
      └──────────────────────────────────────────────────────────┘
```

## 실시간 계층 ([lib/realtime.js](src/lib/realtime.js))

동일 인터페이스(`Room`)를 두 백엔드로 제공:

- **Supabase Realtime** — 실제 멀티유저 (env 설정 시)
- **BroadcastChannel** — 같은 브라우저 탭 간 (로컬 프로토타입)

### 왜 presence가 아니라 broadcast인가 (핵심 의사결정)

초기엔 Supabase **presence**로 참가자 위치를 관리했으나, 이 프로젝트에서
**presence를 쓰면 2명 이상일 때 ~25초 후 소켓이 끊기는 현상**을 E2E로 재현·확인했다.
그래서 presence를 버리고 **broadcast 전용**으로 전환:

- `join` — 입장 알림(+상대가 자기 상태 회신)
- `move` — 위치/생존 신호 (3초 하트비트 + 이동 시 ~10/s throttle)
- `bye` — 명시적 퇴장
- 참가자는 `peerStates` Map으로 직접 관리, `_seen` 타임스탬프로 **GRACE(30s)** 넘으면 정리
- cleaner는 **내 채널이 joined일 때만** 동작 (내 연결 끊김에 헛 퇴장 안 띄움)

### broadcast 이벤트 종류

`join`·`move`·`bye`(명단/위치) · `chat` · `screen` · `board`(화이트보드) · `emote` ·
`draw`(낙서) · `place`(장소) · `cursor` · `rtc`(WebRTC 시그널링) · `announce`(확성기) ·
`rock`(돌 던지기).
모두 `{ broadcast: { self: false } }` — 송신자는 자기 메시지를 안 받고 필요 시 로컬 echo.

참가자 상태(`move`의 payload)에는 위치 외에 `botVisible`·`botSay`(공유된 자비스),
음성/커서 등 부가 정보가 함께 실려 전파된다.

스크린 사진은 파일 선택·클립보드(`Ctrl+V`)·**드래그앤드랍**(창 어디든 이미지를 끌어다 놓으면
`screen` broadcast로 공유) 세 경로로 올릴 수 있다.

## 장소(PLACES) ([constants.js](src/constants.js))

각 장소 = `{ COLS, ROWS, tiles, START, SCREEN, ZONES, BOARDS }`. 빌더 함수로 생성.
- `office` — 팀장석/그룹장석(책상+PC+의자), 그룹원석 12석×4, 화이트보드, 휴식공간+대형스크린
- `conference` — 중앙 대형 스크린 + 사방 둘러앉는 좌석

`tileType(place,r,c)` / `isWall(place,r,c)`로 판정. 장소 이동은 `place` broadcast로 전원 동기.

## 카메라 ([Office.jsx](src/components/Office.jsx))

`.stage`(viewport, overflow hidden) 안에서 `.map`을 `transform: translate scale`로 이동.
- **follow**: 내 캐릭터를 화면 중앙에, 단계 줌(모바일 기본 1.0 / PC 1.9)
- **overview**: 맵 전체를 화면에 맞춤
- 아바타·커서는 맵 좌표로 렌더 → 줌/이동과 함께 정확히 변환

## 음성 ([lib/voice.js](src/lib/voice.js))

WebRTC P2P. 시그널링은 realtime `rtc` broadcast(`to` 필드로 타겟).
- 근접 판정(체비셰프 ≤3) → `setNearby(idSet)` → 연결/해제 diff
- **글레어 방지**: 작은 id가 발신자. **ready 핸드셰이크**로 "상대가 아직 음성 미사용" 타이밍 해결
- `AnalyserNode`로 내/상대 음량(RMS) 측정 → 마이크 게이지
- STUN: Google/Twilio 공개 서버

## 돌 던지기 스킬 ([Rock.jsx](src/components/office/Rock.jsx))

도구 바에서 켜면 클릭/탭이 이동 대신 **돌 투척**이 된다(`rock` broadcast, 1초 쿨다운).
돌은 던진 사람 칸→목표 칸으로 날아가고(거리 비례 시간), **임팩트 시점에 각 클라이언트가
목표 칸 위 아바타를 판정**해 1초간 기절(별 표시)시킨다. 내가 맞으면 `stunUntil`로 이동을
1초 차단한다. 명중 판정은 모든 클라이언트가 동일 좌표로 독립 계산하므로 별도 합의가 없다.

## 방 / 공유 링크 ([lib/room.js](src/lib/room.js))

방 ID는 Supabase 채널명(`office:<id>`)과 URL `?room=`에 그대로 쓰인다(ASCII 제한).
사람이 지은 이름(한글 등)은 URL `?n=`과 로비 beat로 함께 실어 일관되게 표시한다.
- **로비**에서 새 방 생성 → `newRoomId()`(이름 슬러그 + 랜덤6자) → `history.replaceState`로
  주소창에 `?room=(&n=)` 반영(공유 가능) → 입장
- 코드/링크 입장은 `parseRoomInput()`로 전체 URL·`room=` 조각·순수 코드를 모두 수용
- 사무실 상단 **🔗 초대**는 `roomUrl()`을 클립보드 복사(모바일은 `navigator.share`)

### 열린 방 디렉터리 ([realtime.js](src/lib/realtime.js) `createLobby`)

별도 DB 없이 **공유 채널 `town-lobby`**로 활성 방 목록을 만든다(broadcast 패턴 그대로).
- 방에 있는 클라이언트(Office)는 4초마다 `beat({ roomId, name, count })`를 보낸다
- 로비 화면은 beat를 모아 목록을 만들고, 마지막 beat 후 **`LOBBY_GRACE`(60s)** 가 지나면
  (= 모두 나가 beat가 끊기면) 목록에서 제거 → **"모두 나가면 1분 뒤 방 소멸"**
- 이름은 `preferName()`으로 roomId와 다른(사용자가 지은) 값을 우선 유지

## 상태 흐름

```
App: ?room= 있으면 ─→ EntryScreen(해당 방) ─enter→ Office
     없으면 Landing ─→ RoomLobby(생성/입장) ─pick(URL동기화)→ EntryScreen ─→ Office
```

Office가 단일 진실 공급원: pos·peers·screen·boards·strokes·cursors·place 등을
state로 들고 realtime 콜백으로 갱신, refs로 콜백 안에서 최신값 참조.

응집된 로직은 훅으로 분리:
- `useCamera` — 맵 transform(줌/팔로우/전체보기) 계산
- `useProximityVoice` — WebRTC 음성 인스턴스·근접 연결·음량 (시그널링은 `room.onRtc(handleSignal)`)
- `useAiBot` — 자비스 상태·질의응답(채팅 이력 컨텍스트)·공유 broadcast

프레젠테이션 컴포넌트(`components/office/*`)는 `React.memo`로 감싸 place가 바뀔 때만
맵 타일(수백 개)을 다시 그린다 — 음량 폴링·커서 갱신 같은 잦은 리렌더에 영향받지 않음.

## 이동 / 길찾기 ([lib/path.js](src/lib/path.js))

키보드·D패드는 한 칸씩, 맵 클릭/탭은 **BFS 길찾기**로 목표까지 자동 이동(벽이면 가장 가까운
걷는 칸). 스테이지 포인터 핸들러가 탭(이동)·드래그(커서)를 구분하고, 좌표는 카메라 transform을
역산해 맵 칸으로 변환한다.

## 자비스 (AI) ([lib/ai.js](src/lib/ai.js), [api/groq.js](api/groq.js))

Groq LLM 질의응답. **키 비노출**을 위해 Vercel 서버리스 프록시(`/api/groq`, 서버 env `GROQ_API_KEY`)를
우선 호출하고, 없으면(로컬) `VITE_GROQ_API_KEY` 직접 호출로 폴백. 질문 시 **사무실 채팅 이력**을
컨텍스트로 함께 전달. 봇은 기본 개인용이며, 공유를 켜면 내 상태(`botVisible`/`botSay`)에 실려
다른 사람 화면에도 내 옆에 렌더링된다.

## 테스트 전략

Playwright로 **실제 브라우저 2개**를 띄워 클라이언트 간 동기화를 검증(`tests/*.spec.js`).
WebRTC는 가짜 미디어(`--use-fake-device-for-media-stream`)로 검증. 방은 `?room=`로 격리.
이 방식이 이 프로젝트의 모든 실시간 버그(presence 끊김·이동 비전파·메시지 폭주 등)를 잡아냈다.
