import { isTauri } from './runtime'

// While a system dialog (ask/message) is up, the menubar window's
// blur-to-hide handler must not run — otherwise the dialog stealing
// focus would dismiss the window underneath it. We push/pop a counter
// in the Rust AppState around any dialog call.
async function withDialogShield<T>(fn: () => Promise<T>): Promise<T> {
  if (!isTauri()) return fn()
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('push_dialog_shield')
  try {
    return await fn()
  } finally {
    try {
      await invoke('pop_dialog_shield')
    } catch {}
  }
}

async function applyUpdate(update: any) {
  const { relaunch } = await import('@tauri-apps/plugin-process')
  await update.downloadAndInstall()
  await relaunch()
}

async function promptInstall(update: any): Promise<boolean> {
  const { ask } = await import('@tauri-apps/plugin-dialog')
  const body = update.body ? `\n\n${update.body}` : ''
  return withDialogShield(() =>
    ask(
      `Tokcat ${update.version} is available.${body}\n\nInstall and restart now?`,
      {
        title: 'Update available',
        kind: 'info',
        okLabel: 'Install',
        cancelLabel: 'Later',
      },
    ),
  )
}

export async function checkForUpdatesSilent(): Promise<void> {
  if (!isTauri()) return
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return
    if (await promptInstall(update)) await applyUpdate(update)
  } catch {
    // Silent: network failure, no manifest yet, etc. Don't bother the user.
  }
}

export async function checkForUpdatesInteractive(): Promise<void> {
  if (!isTauri()) return
  const { message } = await import('@tauri-apps/plugin-dialog')
  let update: any = null
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    update = await check()
  } catch (e) {
    await withDialogShield(() =>
      message(String(e), { title: 'Update check failed', kind: 'error' }),
    )
    return
  }
  if (!update) {
    await withDialogShield(() =>
      message("You're on the latest version.", { title: 'Tokcat', kind: 'info' }),
    )
    return
  }
  if (await promptInstall(update)) await applyUpdate(update)
}
