# Tokcat

Native macOS menubar dashboard for the [`tokscale`](https://github.com/junhoyeo/tokscale) CLI.
Visualizes your local AI token usage as a 2D / 3D contribution graph.

[한국어 README](./README.ko.md)

![menubar app](src-tauri/icons/icon.png)

## Features

- Lives in the macOS menu bar — no Dock icon, click the title to open the dashboard.
- 2D and 3D contribution graphs of daily token usage.
- Per-client filters (Claude Code, Codex, Cursor, OpenCode, Gemini, Copilot, and any other client `tokscale` supports).
- Summary cards: total tokens, total cost, daily average, longest / current streak, best day.
- Configurable menu bar title: today's tokens, today's cost, total tokens, total cost, or icon-only.
- Optional launch-at-login.
- Auto-update via the in-app updater (signed releases).
- Auto-refreshes every 3 minutes; on-demand refresh from the dashboard.

## Requirements

- macOS 11 (Big Sur) or later, Apple Silicon.
- [`tokscale`](https://github.com/junhoyeo/tokscale) CLI installed and on `PATH` (Tokcat shells out to `tokscale graph --no-spinner`).

## Install

### Recommended — Homebrew

Installs both the Tokcat menubar app and the required `tokscale` CLI in one step.

```sh
brew tap handlecusion/tokcat
brew install --cask tokcat
```

The cask depends on the `tokscale` formula from the same tap, so the CLI is installed automatically.

### DMG

Download the latest `Tokcat_<version>_aarch64.dmg` from
[Releases](https://github.com/handlecusion/tokcat/releases) and drag `Tokcat.app`
into `/Applications`. You will still need to install `tokscale` separately:

```sh
brew install junhoyeo/tokscale/tokscale
```

## Usage

1. Launch **Tokcat** from `/Applications`. The cat icon appears in the menu bar; the Dock stays clean.
2. Click the menu-bar item to open the dashboard.
3. Use the year picker to switch years, the chips below to filter by client, and the toggle in the header to switch between the 2D and 3D views.
4. Open **Settings** (gear icon, or right-click the menu bar item) to:
   - Choose what the menu bar title shows: today's tokens / today's cost / total tokens / total cost / icon only.
   - Toggle the small "cat" tray animation.
   - Enable **Launch at login**.
   - Quit the app.

The dashboard auto-refreshes every 3 minutes. If you see a CLI error, verify that `tokscale` works in Terminal:

```sh
tokscale graph --no-spinner
```

## Build from source

```sh
pnpm install        # or npm install
pnpm tauri:dev      # development (opens the menubar app with HMR on :4061)
pnpm tauri:build    # production .app + .dmg in src-tauri/target/release/bundle
```

The `dev` script (`pnpm dev`) runs the web frontend in a browser at http://localhost:4061
against a small Express + Vite server (`server.js`) that proxies `tokscale graph` —
useful for iterating on the UI without rebuilding the Tauri shell.

## Release

Releases are managed with Git tags. Each release publishes a signed
`Tokcat.app.tar.gz` and a `latest.json` manifest used by the in-app updater.
See `scripts/release.sh` for the full build / sign / publish flow.

## Acknowledgements

Tokcat is built on top of the [`tokscale`](https://github.com/junhoyeo/tokscale) CLI.
Special thanks to [@junhoyeo](https://github.com/junhoyeo) for creating and
maintaining `tokscale` — Tokcat would not exist without it.
