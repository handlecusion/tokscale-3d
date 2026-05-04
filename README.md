# Tokcat

Native macOS menubar dashboard for `tokscale` CLI token usage.

## Install

The recommended install path is Homebrew. It installs both the Tokcat menubar
app and the required `tokscale` CLI.

```sh
brew tap handlecusion/tokcat
brew install --cask tokcat
```

The Homebrew cask installs the Tokcat macOS app and depends on the `tokscale`
formula from the same tap, so the CLI is installed automatically.

Direct DMG installation only installs the app. Use Homebrew for the full app +
CLI setup.

## Usage

After installation, open Tokcat from Applications. Tokcat runs as a macOS
menubar app, so it appears in the menu bar instead of the Dock.

Click the menu bar item to open the dashboard. The app shows token usage from
the local `tokscale` CLI as a 2D or 3D contribution-style graph, with filters by
client and summary cards for totals, daily averages, and streaks.

The menu bar title can show today's tokens, today's cost, total tokens, total
cost, or icon-only mode. Open Settings from the app or the menu bar menu to
change this behavior.

If the dashboard shows a CLI error, confirm that `tokscale` works in Terminal:

```sh
tokscale graph --no-spinner
```

## Release

Releases are managed with Git tags. Each release includes a signed
`Tokcat.app.tar.gz` and a `latest.json` manifest used by the in-app updater.
See `scripts/release.sh` for the build/sign/publish flow.

## Thanks

Tokcat is built on top of the `tokscale` CLI. Special thanks to
[@junhoyeo](https://github.com/junhoyeo) for creating and maintaining
`tokscale`, the CLI that makes this menubar dashboard possible.
