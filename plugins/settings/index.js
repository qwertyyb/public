// import rendererIpc from '../../app/utils/rendererIpc'

const { ipcRenderer } = require('electron')
const { default: rendererIpc } = require('../../app/utils/rendererIpc')

window.rendererIpc = rendererIpc

const getOwnerId = () => {
  return +(new URL(location.href).searchParams.get('ownerid'))
}

const invoke = (channel, args) => rendererIpc.invoke(getOwnerId(),channel, args).catch(err => {
  app.$message.error(err.message)
  throw err;
})

const createKeyEventHandler = (onChange, done) => {
  const key = {
    modifiers: [],
    key: null
  }
  return (event) => {
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
      invoke('getSettings').then(settings => {
        this.settings = settings
      })
      invoke('getPlugins').then(plugins => {
        this.plugins = plugins
        console.log(plugins)
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
      await invoke('registerLaunchAtLogin', {
        settings: this.settings
      })
      this.refreshSettings()
    },
    async onAddPluginClick () {
      const file = await new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.js'
        input.onchange = (e) => {
          const [file] = e.target.files
          if (!file) reject(new Error('no file selected'))
          resolve(file)
        }
        input.click()
      })

      const validateFile = (file) => {
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

      await invoke('registerPlugin', { path: file.path })
      this.$message.success('插件添加成功')
      this.refreshSettings()
    },

    async onRemovePluginClick(index, plugin) {
      await invoke('removePlugin', { index, plugin })
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
    onRemoveShortcutClick(index, shortcutItem) {
      this.settings.shortcuts.splice(index, 1)
      this.updateShortcut()
    },
    async updateShortcut() {
      await invoke('registerShortcuts', {
        settings: this.settings
      })
      this.refreshSettings()
    }
  }
})