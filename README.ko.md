# Tokcat

[`tokscale`](https://github.com/junhoyeo/tokscale) CLI를 위한 네이티브 macOS 메뉴바 대시보드.
로컬 AI 토큰 사용량을 2D / 3D 컨트리뷰션 그래프로 시각화합니다.

[English README](./README.md)

![menubar app](src-tauri/icons/icon.png)

## 주요 기능

- macOS 메뉴바에 상주하며 Dock에는 표시되지 않습니다. 타이틀을 클릭하면 대시보드가 열립니다.
- 일일 토큰 사용량을 2D / 3D 컨트리뷰션 그래프로 시각화합니다.
- 클라이언트별 필터링 지원 (Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot 등 `tokscale`이 지원하는 모든 클라이언트).
- 요약 카드: 누적 토큰, 누적 비용, 일평균, 최장/현재 스트릭, 최고 사용일.
- 메뉴바 타이틀 표시 항목 선택 가능: 오늘의 토큰 / 오늘의 비용 / 전체 토큰 / 전체 비용 / 아이콘만.
- 로그인 시 자동 실행 옵션.
- 인앱 자동 업데이트 (서명된 릴리스).
- 3분마다 자동 새로고침. 대시보드에서 즉시 새로고침도 가능.

## 요구 사항

- macOS 11 (Big Sur) 이상, Apple Silicon.
- [`tokscale`](https://github.com/junhoyeo/tokscale) CLI가 설치되어 `PATH`에 등록되어 있어야 합니다 (Tokcat은 내부적으로 `tokscale graph --no-spinner`를 실행합니다).

## 설치

### 권장 — Homebrew

Tokcat 메뉴바 앱과 필수 의존성인 `tokscale` CLI를 한 번에 설치합니다.

```sh
brew tap handlecusion/tokcat
brew install --cask tokcat
```

cask가 같은 tap의 `tokscale` 포뮬라에 의존하도록 설정되어 있어 CLI가 자동으로 함께 설치됩니다.

### DMG 직접 설치

[Releases](https://github.com/handlecusion/tokcat/releases) 페이지에서 최신
`Tokcat_<version>_aarch64.dmg` 파일을 받아 `Tokcat.app`을 `/Applications`로
드래그합니다. 이 경우 `tokscale`은 별도로 설치해야 합니다:

```sh
brew install junhoyeo/tokscale/tokscale
```

## 사용법

1. `/Applications`에서 **Tokcat**을 실행하세요. 고양이 아이콘이 메뉴바에 나타나고 Dock에는 표시되지 않습니다.
2. 메뉴바 아이템을 클릭하면 대시보드가 열립니다.
3. 연도 선택기로 연도를 전환하고, 하단 칩으로 클라이언트를 필터링하고, 헤더 토글로 2D / 3D 뷰를 전환합니다.
4. **Settings** (톱니바퀴 아이콘 또는 메뉴바 아이템 우클릭)에서 다음을 설정할 수 있습니다:
   - 메뉴바 타이틀에 표시할 항목: 오늘의 토큰 / 오늘의 비용 / 전체 토큰 / 전체 비용 / 아이콘만.
   - 작은 고양이 트레이 애니메이션 토글.
   - **로그인 시 자동 실행** 활성화.
   - 앱 종료.

대시보드는 3분마다 자동 갱신됩니다. CLI 오류가 표시된다면 터미널에서 `tokscale`이 정상적으로 동작하는지 확인하세요:

```sh
tokscale graph --no-spinner
```

## 소스에서 빌드

```sh
pnpm install        # 또는 npm install
pnpm tauri:dev      # 개발 모드 (메뉴바 앱 실행, :4061에서 HMR)
pnpm tauri:build    # 프로덕션 .app + .dmg 빌드 → src-tauri/target/release/bundle
```

`pnpm dev`는 브라우저(http://localhost:4061)에서 웹 프런트엔드만 실행하며,
작은 Express + Vite 서버(`server.js`)가 `tokscale graph`를 프록시합니다.
Tauri 셸을 다시 빌드하지 않고 UI를 빠르게 반복 작업할 때 유용합니다.

## 릴리스

릴리스는 Git 태그로 관리됩니다. 각 릴리스에는 인앱 업데이터가 사용하는 서명된
`Tokcat.app.tar.gz`와 `latest.json` 매니페스트가 포함됩니다. 전체 빌드 / 서명 /
배포 흐름은 `scripts/release.sh`를 참고하세요.

## 감사의 말

Tokcat은 [`tokscale`](https://github.com/junhoyeo/tokscale) CLI를 기반으로 동작합니다.
`tokscale`을 만들고 유지보수해 주시는 [@junhoyeo](https://github.com/junhoyeo)님께
특별히 감사드립니다. tokscale 없이는 Tokcat도 존재할 수 없습니다.
