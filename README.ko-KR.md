<h1 align="center">Tokcat</h1>

<p align="center">
  <strong>당신의 AI 토큰 사용량, macOS 메뉴바에서 살아 움직이게.</strong>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ko-KR.md">한국어</a>
</p>

<p align="center">
  <a href="https://github.com/handlecusion/tokcat/releases/latest"><img src="https://img.shields.io/github/v/release/handlecusion/tokcat?style=flat-square&color=blue" alt="Release"></a>
  <a href="https://github.com/handlecusion/tokcat/stargazers"><img src="https://img.shields.io/github/stars/handlecusion/tokcat?style=flat-square" alt="Stars"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="MIT Licence"></a>
  <img src="https://img.shields.io/badge/macOS-11%2B-black?style=flat-square&logo=apple" alt="macOS 11+">
  <img src="https://img.shields.io/badge/Apple%20Silicon-arm64-success?style=flat-square" alt="Apple Silicon">
  <img src="https://img.shields.io/badge/built%20with-Tauri%202-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri 2">
</p>

<br>

지난 4개월 동안 AI 코딩 도구에 **$2,513.67** 을 썼습니다. 그런데 모르고 있죠 — 볼 수 있는 곳이 없으니까.

Tokcat은 [`tokscale`](https://github.com/junhoyeo/tokscale) CLI를 살아있는 메뉴바 대시보드로 바꿔주는 네이티브 macOS 앱입니다. 메뉴바의 고양이 아이콘이 오늘의 토큰 또는 비용을 보여주고, 클릭하면 macOS 비브런시(frosted glass) popover가 열려 Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot 등 모든 세션의 사용 내역을 2D / 3D 컨트리뷰션 그래프로 보여줍니다.

<p align="center">
  <img src="docs/screenshots/dashboard-3d.png" alt="Tokcat 3D 컨트리뷰션 그래프" width="640" />
</p>

---

## 빠른 시작

```sh
brew tap handlecusion/tokcat
brew install --cask tokcat
```

이게 전부입니다. cask가 의존하는 `tokscale` 포뮬라를 자동으로 함께 설치하므로 별도 작업이 필요 없습니다. `/Applications`에서 **Tokcat**을 실행하면 메뉴바에 고양이가 나타나고 (Dock에는 표시되지 않음) 아이콘 클릭으로 대시보드가 열립니다.

인앱 업데이터는 실행 시 1회 + 30분마다 새 릴리스를 자동 확인합니다. 서명된 `.tar.gz` 아티팩트는 내장된 공개키로 검증된 후 설치됩니다.

> 일회성 DMG로 받고 싶다면
> [Releases](https://github.com/handlecusion/tokcat/releases) 페이지에서
> `Tokcat_<version>_aarch64.dmg`를 받으세요. 이 경우 `tokscale`은 직접
> 설치해야 합니다: `brew install junhoyeo/tokscale/tokscale`. 첫 실행 시
> Tokcat이 CLI 미설치 / 구버전을 감지해 안내 다이얼로그를 띄워줍니다.

---

## 왜 Tokcat인가

| | |
|---|---|
| **한눈에** | 메뉴바 타이틀에 표시할 항목을 선택할 수 있음 — 오늘의 토큰 / 오늘의 비용 / 전체 토큰 / 전체 비용 / 아이콘만. |
| **네이티브** | Tauri 2 셸 + macOS `NSVisualEffectView` 비브런시 + 시스템 폰트 + `prefers-color-scheme` 라이트/다크 자동 대응. |
| **조용함** | 메뉴바에만 상주 — Dock 아이콘 없음, 잡 알림 없음, 다른 앱 클릭 시 자동 hide. |
| **정직함** | 모든 숫자는 `tokscale`이 로컬 세션 로그를 읽어 산출. 텔레메트리·클라우드 동기화·계정 모두 없음. |
| **다중 클라이언트** | `tokscale`이 지원하는 모든 클라이언트 표시 — Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot, Amp, Droid 등. |
| **고양이** | 메뉴바 고양이가 당신의 토큰을 받아먹고 더 많이 소화할수록 빠르게 회전합니다 — 한 마리 생물로 표현된 토큰 처리량. |

---

## 동작 방식

Tokcat은 `tokscale` CLI를 감싸는 얇은 Tauri 래퍼입니다. 3분 간격(또는 트레이의 새로고침 메뉴) 으로 다음을 호출합니다:

```sh
tokscale graph --no-spinner [--year YYYY]
```

JSON 출력은 메모리 캐시에 저장된 후 React 프런트엔드로 전달되어 2D 히트맵 또는 3D 타일 그래프로 렌더링됩니다(react-three-fiber 기반). 클라이언트별 필터, 요약 카드(누적/일평균/스트릭), 메뉴바 타이틀 모두 동일한 페이로드에서 갱신됩니다.

### 2D 히트맵

GitHub 스타일 컨트리뷰션 그리드. 셀 위에 호버하면 날짜 / 비용 / 토큰 정보가 뜹니다.

<p align="center">
  <img src="docs/screenshots/dashboard-2d.png" alt="Tokcat 2D 히트맵" width="640" />
</p>

### 3D 타일 그래프

직교 아이소메트릭 투영 + orbit 컨트롤 + 카메라 영속화. 기본 framing은 active 타일 클러스터에 자동 fit되므로 사용 중인 날들이 빈 미래에 묻히지 않고 또렷하게 보입니다.

<p align="center">
  <img src="docs/screenshots/dashboard-3d.png" alt="Tokcat 3D 타일 그래프" width="640" />
</p>

### Settings 패널

macOS System Settings 스타일의 네이티브 패널 — 메뉴바 타이틀 / 트레이 애니메이션 / 로그인 시 자동 실행 / 원클릭 업데이트 확인.

<p align="center">
  <img src="docs/screenshots/settings.png" alt="Tokcat Settings 패널" width="640" />
</p>

### 토큰을 먹고 회전하는 고양이

마스코트가 아니라 게이지입니다. Tokcat의 메뉴바 고양이는 AI 도구들이 씹어 삼키는 토큰을 그대로 받아먹고, 더 많이 소화할수록 더 빠르게 돕니다. 편집기가 배고플수록 고양이는 시끄러워지고, 가만히 있으면 고양이도 졸음에 빠집니다. Claude Code가 리팩터링을 두들기는 동안엔 빙빙 돌고, 토큰이 흐르지 않으면 멈춥니다. 메뉴바를 한 번 흘낏 보는 것만으로 토큰이 얼마나 빠르게 타고 있는지 알 수 있습니다 — 어떤 창도 열지 않고요.

Settings에서 세 가지 스타일 선택 가능: 와이어프레임 큐브, 긴 사이클 고양이, 짧은 사이클 고양이.

<p align="center">
  <img src="docs/screenshots/tray-anim-cat1.gif" alt="긴 사이클 고양이" width="128" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/tray-anim-cat2.gif" alt="짧은 사이클 고양이" width="128" />
</p>

---

## 기능

| 기능 | 설명 |
|------|------|
| **2D / 3D 컨트리뷰션 그래프** | GitHub 스타일 히트맵 또는 인터랙티브 3D 타일 그래프. orbit 컨트롤, 카메라 상태 저장, active 타일 자동 fit. |
| **클라이언트별 필터** | Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot 등 — `tokscale`이 발견한 클라이언트가 자동으로 표시됨. |
| **라이브 메뉴바 타이틀** | 오늘의 토큰 / 오늘의 비용 / 전체 토큰 / 전체 비용 / 아이콘만. 3분마다 갱신. |
| **트레이 아이콘 애니메이션** | 고양이(또는 와이어프레임 큐브) 회전 속도가 실시간 토큰 처리량에 따라 변동. |
| **네이티브 비브런시 + 글래스모피즘** | 투명 윈도우 + macOS `sidebar` 머티리얼; 라이트/다크 자동 전환. |
| **메뉴바 popover 동작** | chromeless 윈도우, 헤더 드래그 영역, 다른 앱 클릭 시 자동 hide. |
| **Settings 패널** | macOS System Settings 스타일 — 스위치 토글, 카드 그룹, 버전 표시, 원클릭 업데이트 확인. |
| **첫 실행 온보딩** | `tokscale` 미설치 또는 구버전이면 brew 설치/업그레이드 명령을 안내하는 모달이 자동으로 뜸. |
| **인앱 자동 업데이트** | 서명된 Tauri 업데이터. 시작 시 + 30분마다 silent 체크. Settings/트레이 메뉴에서 수동 체크 가능. |
| **로그인 시 자동 실행** | Tauri autostart 플러그인 — Settings에서 활성화. |
| **스트릭 & 요약** | 최장/현재 스트릭, 누적 토큰, 누적 비용, 일평균, 최고 사용일. |
| **텔레메트리 없음** | 업데이터 매니페스트 외에는 어떤 네트워크 요청도 발생하지 않음. 데이터는 모두 로컬에 머무름. |

---

## 사용법

설치 후 `/Applications`에서 **Tokcat**을 실행하세요. 메뉴바의 고양이 아이콘 클릭으로 대시보드를 엽니다. 우클릭으로 트레이 메뉴(Open, Settings…, Refresh Now, About, Check for Updates, Quit) 가 표시됩니다.

<details>
<summary><strong>키보드 및 메뉴 단축키</strong></summary>
<br>

| 동작 | 단축키 |
|---|---|
| Settings 열기 | <kbd>⌘</kbd>, (트레이 메뉴) |
| 즉시 새로고침 (3분 캐시 무시) | <kbd>⌘</kbd>R (트레이 메뉴) |
| Tokcat 종료 | <kbd>⌘</kbd>Q (트레이 메뉴) |

</details>

<details>
<summary><strong>Settings 항목</strong></summary>
<br>

| 항목 | 효과 |
|---|---|
| Menubar title | 메뉴바 아이콘 옆에 표시할 텍스트 종류 |
| Launch at login | 로그인 시 Tokcat 자동 시작 (Tauri autostart) |
| Animate tray icon | 고양이/큐브 애니메이션 (토큰 처리량에 비례한 속도) |
| About → Version | 현재 설치된 Tokcat 버전 |
| About → Check Now | 트레이 메뉴의 "Check for Updates…"와 동일하지만 패널 안에서 실행 |
| Quit Tokcat | 앱 종료 |

</details>

<details>
<summary><strong>문제 해결</strong></summary>
<br>

**대시보드에 `tokscale CLI not found` 또는 `env: node: No such file or directory` 표시**

Tokcat은 `tokscale`을 호출하고, 그 자체는 Node 기반 CLI입니다. 둘 다 설치되어 PATH에 있어야 합니다:

```sh
which tokscale          # /opt/homebrew/bin/tokscale
which node              # /opt/homebrew/bin/node
tokscale graph --no-spinner | head -20
```

Terminal에서는 동작하는데 Tokcat에서만 실패한다면 `LaunchServices` 환경의 PATH 보강이 빠진 구버전을 쓰고 있는 것입니다. Settings → About → Check Now 또는 `brew upgrade --cask tokcat`으로 업데이트하세요.

**다른 곳을 클릭하면 메뉴바 윈도우가 사라짐**

이는 의도된 동작입니다 — 표준 macOS 메뉴바 popover처럼 동작합니다. 다른 앱과 함께 보면서 작업하려면 헤더의 빈 영역(컨트롤이 없는 부분)을 잡아 드래그해 메뉴바에서 떼어 놓으면 됩니다.

**`brew install --cask tokcat` 시 formula not found**

tap을 다시 등록: `brew tap handlecusion/tokcat && brew update`.

</details>

---

## 소스에서 빌드

```sh
git clone https://github.com/handlecusion/tokcat.git
cd tokcat
pnpm install            # 또는 npm install
pnpm tauri:dev          # 메뉴바 앱 + Vite HMR (:4061)
pnpm tauri:build        # 프로덕션 .app + .dmg → src-tauri/target/release/bundle
```

`pnpm dev`는 브라우저(`http://localhost:4061`)에서 웹 프런트엔드만 실행하며 작은 Express + Vite 서버(`server.js`)가 `tokscale graph`를 프록시합니다. Tauri 셸을 다시 빌드하지 않고 UI를 빠르게 반복할 때 유용합니다.

<details>
<summary><strong>새 버전 릴리스</strong></summary>
<br>

```sh
# 1. package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml에 버전 bump
# 2. cargo check (Cargo.lock 갱신)
# 3. 커밋 후 origin/main에 푸시
scripts/release.sh <version> "<release notes>"
```

`scripts/release.sh`는 프로덕션 앱과 DMG를 빌드하고, 내장 `.VolumeIcon.icns`를 제거(Finder에서 숨김 파일 표시 시 보이는 잔존 캐시) 한 후, 업데이터 서명을 생성하고, `latest.json`을 작성하고, 태그를 만들어 `gh release create`로 일괄 업로드합니다.

릴리스 후 [`handlecusion/homebrew-tokcat`](https://github.com/handlecusion/homebrew-tokcat)의 `Casks/tokcat.rb`도 갱신해야 brew 사용자가 새 버전을 받을 수 있습니다.

</details>

---

## 관련 리포지토리

| Repo | 역할 |
|---|---|
| [`handlecusion/tokcat`](https://github.com/handlecusion/tokcat) | 앱 소스, GitHub Releases, 인앱 업데이터 매니페스트 |
| [`handlecusion/homebrew-tokcat`](https://github.com/handlecusion/homebrew-tokcat) | Homebrew tap (`Casks/tokcat.rb`) — `brew install --cask tokcat`이 가리키는 곳 |
| [`junhoyeo/tokscale`](https://github.com/junhoyeo/tokscale) | Tokcat이 모든 데이터를 의존하는 상류 CLI |

---

## 감사의 말

Tokcat은 [`tokscale`](https://github.com/junhoyeo/tokscale) CLI를 기반으로 동작합니다. `tokscale`을 만들고 유지보수해 주시는 [@junhoyeo](https://github.com/junhoyeo)님께 특별히 감사드립니다. tokscale 없이는 Tokcat도 존재할 수 없습니다.

---

## 라이선스

MIT. [LICENSE](LICENSE) 참고.

<p align="center">
<br>
<code>brew tap handlecusion/tokcat &amp;&amp; brew install --cask tokcat</code><br>
<sub>macOS 11+ · Apple Silicon · Tauri 2 · React / Vite · MIT</sub>
</p>
