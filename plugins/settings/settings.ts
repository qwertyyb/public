import type { RunningPublicPlugin } from "shared/types/plugin"
import { ipcRenderer } from "electron"

const createRpc = () => {
  const callbackMap = new Map()
  let queue = []
  let port = null
  ipcRenderer.on('port', event => {
    port = event.ports[0]
    port.addEventListener('message', (event: MessageEvent) => {
      console.log('event', event)
      const { type, callbackName, returnValue, error } = event.data
      if (type !== 'callback') return;
      const { resolve, reject } = callbackMap.get(callbackName)
      if (error) {
        reject?.(new Error(error))
      } else {
        resolve?.(returnValue)
      }
      callbackMap.delete(callbackName)
    })
    port.start()
    queue.slice().forEach(item => port?.postMessage(item))
    queue = []
  })
  return {
    invoke(methodName: string, args?: any) {
      return new Promise((resolve, reject) => {
        const callbackName = `${methodName}_${Math.random()}`
        callbackMap.set(callbackName, { resolve, reject })
        const item = {
          type: 'method',
          methodName,
          args,
          callbackName
        }
        if (port) {
          port?.postMessage(item)
        } else {
          queue.push(item)
        }
      })
    }
  }
}

const rpc = createRpc()

interface ShortcutKey {
  modifiers: string[],
  key: string | null
}

const createKeyEventHandler = (onChange: (key: ShortcutKey) => void, done: (key: ShortcutKey) => void) => {
  const key = {
    modifiers: [],
    key: null
  }
  return (event: KeyboardEvent) => {
    event.preventDefault()
    const detectKeys = ['Meta', 'Control', 'Alt', 'Shift']
    // 键名windows和mac不一样，需要转换
    const macLabels = ['Command', 'Control', 'Option', 'Shift']
    const winLabels = ['Windows', 'Control', 'Alt', 'Shift']
    const isWindows = () => /windows|win32/i.test(navigator.userAgent)
    const labels = isWindows() ? winLabels : macLabels
    // 获取修饰按键的状态
    const activeState = detectKeys.map(key => event.getModifierState(key))
    // 根据修饰按键的状态获取平台对应的键名
    const activeLabels = activeState.map((active, index) => active ? labels[index] : null).filter(label => !!label)
    // 排下序，已经按下过的放在前面
    // 先去掉已经抬起的键
    let modifiers = key.modifiers.filter(label => activeLabels.includes(label))
    // 加上本次按下的键
    modifiers = modifiers.concat(...activeLabels.filter(label => !modifiers.includes(label)))
    key.modifiers = modifiers

    if (event.type === 'keydown' && (/^[a-zA-Z]$/.test(event.key) || event.code === 'Space')) {
      const keyLabel = event.code === 'Space' ? 'Space' : event.key
      key.key = keyLabel
      done(key)
    }
    onChange(key)
  }
}

const clearKeyEventHandler = (keyEventHandler) => {
  document.removeEventListener('keydown', keyEventHandler)
  document.removeEventListener('keyup', keyEventHandler)
}

// @ts-ignore
var app = new Vue({
  el: '#app',
  data: {
    views: {
      'common': '通用',
      'plugins': '插件设置',
      'shortcut': '快捷键设置'
    },
    curView: 'common',
    plugins: [],
    settings: {},
  },
  created() {
    this.refreshSettings()
  },
  methods: {
    async refreshSettings() {
      rpc.invoke('getSettings').then(settings => {
        this.settings = settings
      })
      rpc.invoke('getPlugins').then(plugins => {
        this.plugins = plugins
      })
    },
    async onShortcutBtnClicked(event, keyObj) {
      let original = keyObj.shortcut
      if (this.keyEventHandler) clearKeyEventHandler(this.keyEventHandler)
      const keyEventHandler = createKeyEventHandler(key => {
        console.log(key)
        keyObj.shortcut = [...key.modifiers, key.key].filter(i => i).join('+') || 'CommandOrControl+Space'
      }, (key) => {
        clearKeyEventHandler(keyEventHandler)
        const keyStore = [...key.modifiers, key.key].filter(i => i).join('+')
        keyObj.shortcut = keyStore
        delete keyObj.temp
        original = keyStore
        this.updateShortcut()
      })
      this.keyEventHandler = keyEventHandler
      document.addEventListener('keydown', keyEventHandler)
      document.addEventListener('keyup', keyEventHandler)
      event.target.addEventListener('blur', (e) => {
        keyObj.shortcut = original
        clearKeyEventHandler(this.keyEventHandler)
      })
    },
    async onLaunchAtLoginChange (launchAtLogin) {
      this.settings.launchAtLogin = launchAtLogin
      await rpc.invoke('registerLaunchAtLogin', {
        settings: this.settings
      })
      this.refreshSettings()
    },
    async onAddPluginClick () {
      const file: File = await new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.js'
        input.onchange = (e: InputEvent) => {
          const [file] = (e.target as HTMLInputElement).files
          if (!file) reject(new Error('no file selected'))
          resolve(file)
        }
        input.click()
      })

      const validateFile = (file: File) => {
        try {
          const plugin = window.require(file.path)
          if (typeof plugin !== 'function' && typeof plugin.default !== 'function') {
            throw new Error('应该是一个函数')
          }
        } catch(err) {
          this.$message.error('导入插件失败')
          throw err
        }
      }
      
      validateFile(file)

      await rpc.invoke('registerPlugin', { path: file.path })
      this.$message.success('插件添加成功')
      this.refreshSettings()
    },

    async onRemovePluginClick(index: number, plugin: Pick<RunningPublicPlugin, 'plugin'>) {
      await rpc.invoke('removePlugin', { index, plugin })
      this.$message.success('插件移除成功')
      this.refreshSettings()
    },

    async onAddShortcutClick() {
      this.settings.shortcuts.push({
        keyword: '',
        shortcut: '',
        temp: true
      })
    },
    onRemoveShortcutClick(index: number, shortcutItem) {
      this.settings.shortcuts.splice(index, 1)
      this.updateShortcut()
    },
    async updateShortcut() {
      await rpc.invoke('registerShortcuts', {
        settings: this.settings
      })
      this.refreshSettings()
    }
  }
})