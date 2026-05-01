// Detect whether we're running inside a Tauri webview vs a regular browser.
// Tauri injects window.__TAURI_INTERNALS__ (Tauri 2.x) on context init.
declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
    __TAURI__?: unknown
  }
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__)
}
