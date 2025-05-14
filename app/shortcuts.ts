import { globalShortcut } from 'electron'

export const register = (shortcuts: string, callback: () => void) => {
  return globalShortcut.register(shortcuts, callback)
}

export const unregister = (shortcuts: string) => {
  return globalShortcut.unregister(shortcuts)
}

export const unregisterAll = () => {
  return globalShortcut.unregisterAll()
}
