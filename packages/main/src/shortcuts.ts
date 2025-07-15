import { globalShortcut } from 'electron'
import log from 'electron-log/main'
import { register as shortcutsHookRegister, unregister as shortcutsHookUnregister, unregisterAll as shortcutsHookUnregisterAll } from './shortcuts-hook'

const isElectronSupport = (shortcuts: string) => {
  const keys = shortcuts.split('+')
  // 有两个相同的键，electron 不支持
  return keys.length === new Set(keys).size
}

export const register = (shortcuts: string, callback: () => void) => {
  log.info('register shortcuts', shortcuts)
  if (isElectronSupport(shortcuts)) {
    return globalShortcut.register(shortcuts, callback)
  }
  log.info('register shortcuts, electron doesn\'t support, use hook')
  return shortcutsHookRegister(shortcuts, callback)
}

export const unregister = (shortcuts: string) => {
  log.info('unregister shortcuts', shortcuts)
  if (isElectronSupport(shortcuts)) {
    return globalShortcut.unregister(shortcuts)
  }
  log.info('unregister shortcuts, electron doesn\'t support, use hook')
  return shortcutsHookUnregister(shortcuts)
}

export const unregisterAll = () => {
  log.info('unregister all shortcuts')
  shortcutsHookUnregisterAll()
  return globalShortcut.unregisterAll()
}
