import EventEmitter from 'events'
import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi'

// electron globalShortcut 不支持的，由 uiohook-napi 支持

const keycodeNames = Object.keys(UiohookKey).reduce<Record<number, string>>((acc, name) => {
  return { ...acc, [UiohookKey[name as keyof typeof UiohookKey]]: name }
}, {})

const eventBus = new EventEmitter()

const ModifierKeys = [ 'Meta', 'MetaLeft', 'Shift', 'ShiftRight', 'Alt', 'AltRight', 'Control', 'ControlRight']

const Keys = Object.keys(UiohookKey).filter(i => !ModifierKeys.includes(i))

let isListening = false

const start = () => {
  if (isListening) return;
  isListening = true
  let lastModifierKeydownTime = 0
  let lastKey: string = ''
  const repeatKeydownInterval = 200 // 200ms
  const keydownHandler = (event: UiohookKeyboardEvent) => {
    const key = keycodeNames[event.keycode]
    if (!key) return

    if (ModifierKeys.includes(key)) {
      // 按下的修饰键，首先判断是否是连续第二次按下同样的键
      if (Date.now() - lastModifierKeydownTime < repeatKeydownInterval && lastKey === key) {
        const eventName = [lastKey, key].join('+')
        eventBus.emit(eventName)
      }
      lastModifierKeydownTime = Date.now()
    }
    lastKey = key

    const modifiers = []
    if (event.metaKey) {
      modifiers.push('Meta')
    }
    if (event.altKey) {
      modifiers.push('Alt')
    }
    if (event.ctrlKey) {
      modifiers.push('Control')
    }
    if (event.shiftKey) {
      modifiers.push('Shift')
    }
    if (Keys.includes(key) && modifiers.length) {
      // 修饰键 + 普通键
      const shortcuts = [...modifiers, key].sort().join('+')
      eventBus.emit(shortcuts)
    }
  }

  uIOhook.on('keydown', keydownHandler)
  
  uIOhook.start()
}

const stop = () => {
  uIOhook.removeAllListeners()
  uIOhook.stop()
  isListening = false
}

// shortcuts: Meta+Meta, Meta+A, Meta+Shift+V
export const register = (shortcuts: string, callback: () => void) => {
  const eventName = shortcuts.split('+').sort().join('+')
  eventBus.on(eventName, callback)
  start()
  return true
}
export const unregister = (shortcuts: string) => {
  eventBus.removeAllListeners(shortcuts)
  const count = eventBus.eventNames().reduce((acc, eventName) => acc + eventBus.listenerCount(eventName), 0)
  if (!count) {
    stop()
  }
}
export const unregisterAll = () => {
  eventBus.removeAllListeners()
  stop()
}
