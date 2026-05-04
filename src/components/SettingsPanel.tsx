import React, { useEffect, useState } from 'react'
import {
  AnimationStyle,
  ANIMATION_STYLE_LABELS,
  Settings,
  TrayMode,
  TRAY_MODE_LABELS,
} from '../lib/settings'
import { isTauri } from '../lib/runtime'

interface Props {
  open: boolean
  onClose: () => void
  settings: Settings
  onChange: (s: Settings) => void
}

export function SettingsPanel({ open, onClose, settings, onChange }: Props) {
  const [autostartBusy, setAutostartBusy] = useState(false)
  const tauri = isTauri()

  useEffect(() => {
    if (!open || !tauri) return
    let cancelled = false
    ;(async () => {
      try {
        const m = await import('@tauri-apps/plugin-autostart')
        const enabled = await m.isEnabled()
        if (!cancelled && enabled !== settings.autostart) {
          onChange({ ...settings, autostart: enabled })
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [open, tauri])

  async function setAutostart(enabled: boolean) {
    if (!tauri) {
      onChange({ ...settings, autostart: enabled })
      return
    }
    setAutostartBusy(true)
    try {
      const m = await import('@tauri-apps/plugin-autostart')
      if (enabled) await m.enable()
      else await m.disable()
      onChange({ ...settings, autostart: enabled })
    } catch (e) {
      console.error('autostart toggle failed', e)
    } finally {
      setAutostartBusy(false)
    }
  }

  async function quitApp() {
    if (!tauri) return
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('quit_app')
    } catch {}
  }

  if (!open) return null

  const modes: TrayMode[] = ['today_tokens', 'today_cost', 'total_tokens', 'total_cost', 'hidden']

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel" role="dialog">
        <div className="settings-head">
          <strong>Settings</strong>
          <button className="settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-section">
          <label className="settings-label">Menubar title</label>
          <div className="settings-radio-list">
            {modes.map(m => (
              <label key={m} className="settings-radio">
                <input
                  type="radio"
                  name="tray-mode"
                  checked={settings.trayMode === m}
                  onChange={() => onChange({ ...settings, trayMode: m })}
                />
                <span>{TRAY_MODE_LABELS[m]}</span>
              </label>
            ))}
          </div>
        </div>

        {tauri && (
          <div className="settings-section">
            <label className="settings-label">Startup</label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.autostart}
                disabled={autostartBusy}
                onChange={e => setAutostart(e.target.checked)}
              />
              <span>Launch at login</span>
            </label>
          </div>
        )}

        {tauri && (
          <div className="settings-section">
            <label className="settings-label">Menubar icon</label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.animateTray}
                onChange={e => onChange({ ...settings, animateTray: e.target.checked })}
              />
              <span>Animate based on token usage</span>
            </label>
            {settings.animateTray && (
              <div className="settings-radio-list" style={{ marginTop: 8 }}>
                {(['cube', 'cat'] as AnimationStyle[]).map(s => (
                  <label key={s} className="settings-radio">
                    <input
                      type="radio"
                      name="animation-style"
                      checked={settings.animationStyle === s}
                      onChange={() => onChange({ ...settings, animationStyle: s })}
                    />
                    <span>{ANIMATION_STYLE_LABELS[s]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {tauri && (
          <div className="settings-section">
            <button className="settings-quit" onClick={quitApp}>
              Quit Tokscale
            </button>
          </div>
        )}
      </div>
    </>
  )
}
