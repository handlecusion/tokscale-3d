import React, { useState } from 'react'

interface Props {
  state: 'missing' | 'outdated'
  detected: string | null
  minVersion: string
  onDismiss: () => void
  onRecheck: () => void
}

const INSTALL_CMD = 'brew install junhoyeo/tokscale/tokscale'
const UPGRADE_CMD = 'brew upgrade tokscale'

export function TokscaleSetup({ state, detected, minVersion, onDismiss, onRecheck }: Props) {
  const [copied, setCopied] = useState(false)
  const [rechecking, setRechecking] = useState(false)
  const cmd = state === 'missing' ? INSTALL_CMD : UPGRADE_CMD

  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  async function recheck() {
    setRechecking(true)
    try {
      await onRecheck()
    } finally {
      setRechecking(false)
    }
  }

  const title =
    state === 'missing' ? 'Tokcat needs the tokscale CLI' : 'Update tokscale to continue'

  const body =
    state === 'missing'
      ? 'Tokcat reads your AI token usage from the tokscale command-line tool. Install it with Homebrew, then come back and re-check.'
      : `Tokcat requires tokscale ${minVersion} or newer. Detected version: ${detected}. Upgrade with Homebrew, then re-check.`

  return (
    <>
      <div className="settings-overlay" />
      <div className="settings-panel onboarding-panel" role="dialog" aria-labelledby="ob-title">
        <div className="onboarding-body">
          <div className="onboarding-title" id="ob-title">{title}</div>
          <div className="onboarding-text">{body}</div>
          <div className="onboarding-cmd">
            <code>{cmd}</code>
            <button className="settings-button" onClick={copy} aria-label="Copy command">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="onboarding-hint">
            Run the command in Terminal, then click <strong>Re-check</strong>.
          </div>
        </div>
        <div className="onboarding-actions">
          <button className="settings-button" onClick={onDismiss}>Later</button>
          <button
            className="settings-button primary"
            onClick={recheck}
            disabled={rechecking}
          >
            {rechecking ? 'Checking…' : 'Re-check'}
          </button>
        </div>
      </div>
    </>
  )
}
