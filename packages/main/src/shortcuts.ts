import { globalShortcut } from 'electron'
import { register as shortcutsHookRegister, unregister as shortcutsHookUnregister, unregisterAll as shortcutsHookUnregisterAll } from './shortcuts-hook'

const isElectronSupport = (shortcuts: string) => {
  const keys = shortcuts.split('+')
  // 有两个相同的键，electron 不支持
  return keys.length === new Set(keys).size
}

export const register = (shortcuts: string, callback: () => void) => {
  if (isElectronSupport(shortcuts)) {
    return globalShortcut.register(shortcuts, callback)
  }
  return shortcutsHookRegister(shortcuts, callback)
}

export const unregister = (shortcuts: string) => {
  if (isElectronSupport(shortcuts)) {
    return globalShortcut.unregister(shortcuts)
  }
  return shortcutsHookUnregister(shortcuts)
}

export const unregisterAll = () => {
  shortcutsHookUnregisterAll()
  return globalShortcut.unregisterAll()
}
