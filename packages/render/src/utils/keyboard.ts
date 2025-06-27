export const getPressedKeys = (event: KeyboardEvent) => {
  const detectKeys = ['Meta', 'Control', 'Alt', 'Shift']
  const modifiers = detectKeys.filter(key => event.getModifierState(key))
  const isModifierKeyDown = detectKeys.includes(event.key) // 当前按下的是否就是修饰键
  const keys = isModifierKeyDown ? [...modifiers] : [...modifiers, event.key]
  return keys
}

export const isKeyPressed = (expect: string | string[] | KeyboardEvent, value: string | string[]) => {
  let expectKeys: string[] = []
  if (expect instanceof KeyboardEvent) {
    expectKeys = getPressedKeys(expect)
  } else {
    expectKeys = typeof expect === 'string' ? expect.split('+') : [...expect]
  }
  const valueKeys = typeof value === 'string' ? value.split('+') : [...value]
  return expectKeys.sort().join('+') === valueKeys.sort().join('+')
}