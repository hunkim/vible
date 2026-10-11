# VibleNow 네이티브 앱 (iOS · iPadOS · Android · macOS · Windows)

갱신 2026-10-11. 상태: 앱 셸 구현·시뮬레이터 검증 완료, 스토어 계정·서명·심사 대기.

## 결정 사항

- **정식 출시**: App Store(iPhone·iPad), Google Play(폰·태블릿), Mac App Store, Microsoft Store.
- **앱 이름 VibleNow**: "Vible"은 App Store·Google Play에서 다른 성경 앱이 사용 중
  ("Vible: Living Scriptures", Full Body Zen LLC, `com.subverse.vible`). 2026-10-11 검색 기준
  VibleNow는 세 스토어에 없음. 계정 개설 직후 App Store Connect에서 이름부터 예약할 것.
- **앱 ID** `now.vible.app` (전 플랫폼 공통).
- **배포 국가: 전체**. 단, 중국 본토 App Store는 ICP 비안 번호가 필요하고 종교 앱 심사가 제한적이라
  선택해도 승인되지 않을 수 있음. Google Play는 중국 본토에서 서비스되지 않음.

## 구조 (웹이 원본)

```
platform.js        웹/앱 차이를 모은 어댑터 (공유 시트, 저장, 외부 링크, API 주소)
i18n.js            UI 문자열 4개 언어 사전 + data-i18n 적용
image-cache.js     앱 전용 최근 그림 60장 오프라인 캐시 (웹은 sw.js가 담당)
build.mjs --target=native   → dist-native/ (서비스워커·매니페스트·프롬프트 JSON 제외, 약 40MB)
native/
  package.json     Capacitor 8.5.2, Tauri CLI 2.12.0 (2주 이상 지난 버전 고정)
  capacitor.config.json
  ios/             Xcode 프로젝트 (iPhone·iPad 유니버설)
  android/         Gradle 프로젝트 (minSdk 24, targetSdk 36)
  desktop/src-tauri/  macOS·Windows 셸 (Tauri 2.12.0)
  resources/generate.py  원본 아이콘에서 모든 아이콘·스플래시 생성
```

웹 배포(`npm run build` → `dist/` → Vercel)는 바뀌지 않는다. 앱은 같은 소스를 번들한다.

## 개발 명령

```sh
cd native && npm ci
npm run sync                 # 번들 빌드 후 iOS/Android에 복사
npm run ios                  # Xcode 열기
npm run android              # Android Studio 열기 (JDK 21 필요)
npm run desktop:build        # macOS .app/.dmg (Windows는 Windows에서 실행)
python3 resources/generate.py   # 아이콘·스플래시 재생성
```

## 검증 결과 (2026-10-11)

| 환경 | 확인 내용 |
|---|---|
| iPhone 16 Pro 시뮬레이터 (iOS) | 실행, 안전 영역, 링크 공유 시트, PNG 카드 공유 |
| iPad Pro 11 시뮬레이터 | 세로 레이아웃, iPad 공유 팝오버(크래시 없음) |
| iPad 가로 1210×834 | 2단 레이아웃 (브라우저 뷰포트) |
| Android 14 폰 에뮬레이터 | 실행, 영어·일본어 UI, 링크·이미지 공유 시트, 비행기 모드에서 본문과 본 그림 표시 |
| Android 16 태블릿 에뮬레이터 | 가로·세로 레이아웃, edge-to-edge에서 상태 표시줄과 겹치지 않음 |
| macOS (Tauri) | 실행, 카드 저장 대화상자로 1200×675 PNG 저장 |
| 웹 en/ja/zh | 모든 화면·대화상자에서 한국어 UI 문자열 0개 (본문 제외) |

자동 검사: `npm run check`에 `check-i18n.mjs`, `check-native.mjs` 추가. `node check-offline.mjs` 통과.

## 출시 전 남은 일

### 사용자가 직접 해야 하는 일 (계정·결제·서명)
1. Apple Developer Program 가입(연 $99) → App Store Connect에서 앱 생성, 이름 **VibleNow** 예약,
   iOS와 macOS 번들 ID `now.vible.app` 등록. Team ID 알려 주기.
2. Google Play Console 가입($25) → 앱 생성. 개인 계정이면 비공개 테스트(테스터 12명·14일) 요건 확인.
   앱 서명 키 SHA-256 알려 주기.
3. Microsoft Partner Center 개발자 등록 → 앱 이름 VibleNow 예약.
4. 개인정보처리방침 URL 확정(추적 없음, 노트는 기기 저장, 피드백 메시지만 서버 전송).

### 그 다음 진행할 일
- **웹 배포 먼저**: 앱의 피드백 전송은 `api/feedback.mjs`의 앱 origin CORS 허용이 production에
  배포되어야 동작한다. i18n·카드 줄바꿈·장면 아이콘 정리도 웹에 함께 반영된다.
- 딥링크: Team ID와 Play 서명 SHA-256을 받은 뒤 `/.well-known/apple-app-site-association`,
  `/.well-known/assetlinks.json` 추가.
- Windows: Windows 환경(CI)에서 Tauri 빌드 후 MSIX 패키징 → Store가 서명.
- Mac App Store: 샌드박스 Entitlements 적용, `.pkg` 업로드.
- CI 서명 빌드(GitHub Actions, 키는 Secrets), `native-release.json`에 스토어별 버전 기록.
- 스토어 자료: 4개 언어 설명·스크린샷(폰·태블릿·데스크톱), 연령 등급 설문.
- 본문 라이선스: 개역한글의 앱 배포 범위를 대한성서공회 안내로 확인 (BSB Public Domain,
  OpenCCB CC BY-SA 4.0 출처 표기 유지, 일본어 1955/1965 보호기간 만료 근거 보관).

## 콘텐츠 업데이트

앱 코드는 스토어 업데이트로 바뀌고, 그림은 기존 CDN(`images.vible.now`)에서 받는다.
새로 공개된 그림은 이미 번들된 본문 JSON의 공개 상태에 따라 표시되므로, 새 책이나 새 그림 공개를
앱에 반영하려면 현재는 앱 업데이트가 필요하다. 본문 JSON을 원격으로 갱신하는 기능은 다음 단계.
