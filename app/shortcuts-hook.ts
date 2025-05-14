import EventEmitter from 'events'
import { uIOhook, UiohookKey, UiohookKeyboardEvent } from 'uiohook-napi'

const keycodeNames = Object.keys(UiohookKey).reduce<Record<number, string>>((acc, name) => {
  return { ...acc, [UiohookKey[name as keyof typeof UiohookKey]]: name }
}, {})

const eventBus = new EventEmitter()

const ModifierKeys = [ 'Meta', 'MetaLeft', 'Shift', 'ShiftRight', 'Alt', 'AltRight', 'Control', 'ControlRight']

const Keys = Object.keys(UiohookKey).filter(i => !ModifierKeys.includes(i))

// shortcuts: Meta+Meta, Meta+A, Meta+Shift+V
export const register = (shortcuts: string, callback: () => void) => {
  const eventName = shortcuts.split('+').sort().join('+')
  // 检查是否是双击 modifier 键，modifier 有 Meta、Alt(Option)、Control、Shift
  eventBus.on(eventName, callback)
}
export const unregister = (shortcuts: string, callback?: () => void) => {
  eventBus.off(shortcuts, callback as any)
}
export const unregisterAll = () => {
  eventBus.removeAllListeners()
}

export const on = eventBus.on.bind(eventBus)

const startListener = () => {
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
        eventBus.emit('shortcuts', { shortcuts: eventName })
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
      eventBus.emit('shortcuts', { shortcuts })
    }
  }

  uIOhook.on('keydown', keydownHandler)
  
  uIOhook.start()
}

startListener()