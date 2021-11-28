const getDefaultSettings = () => {
  const getDefaultPluginPaths = () => {
    const paths = [
      // // path.resolve(__dirname, '../../launcher/index.js'),
      // path.resolve(__dirname, '../command/index'),
      // path.resolve(__dirname, '../calculator'),
      // // path.resolve(__dirname, '../qrcode'),
      // path.resolve(__dirname, '../search/index'),
      // path.resolve(__dirname, '../translate/index'),
      // path.resolve(__dirname, '../clipboard/index'),
      // path.resolve(__dirname, '../terminal/index')
    ].map(pathstr => ({ path: __non_webpack_require__.resolve(pathstr) }))

    return paths.map(pathstr => ({ path: pathstr }))
  }

  return {
    launchAtLogin: true,
    shortcut: 'CommandOrControl+Space',
    shortcuts: [
      { keyword: 'cp ', shortcut: 'Command+Shift+V' }
    ],
    plugins: getDefaultPluginPaths()
  }
}

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
      window.publicApp.storage.getItem('config').then(settings => {
        this.settings = settings && JSON.parse(settings) || getDefaultSettings()
        window.publicApp.enableLaunchAtLogin(this.settings.launchAtLogin)
        window.publicApp.registerShortcuts(this.settings)
        console.log(this.settings)
        this.settings.plugins.forEach(({ path }) => {
          window.publicApp.pluginManager.register(path)
        })
      })
    },
    async saveSettings() {
      await window.publicApp.storage.setItem('config', JSON.stringify(this.settings))
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
      window.publicApp.enableLaunchAtLogin(launchAtLogin)
      this.saveSettings()
    },
    async onAddPluginClick () {
      const file = await new Promise((resolve, reject) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
          const [file] = e.target.files
          if (!file) reject(new Error('no file selected'))
          resolve(file)
        }
        input.click()
      })

      await window.publicApp.pluginManager.register(file.path)
      const plugins = await window.publicApp.pluginManager.getList()
      this.settings.plugins = plugins
      this.$message.success('插件添加成功')
      this.saveSettings()
    },

    async onRemovePluginClick(index, plugin) {
      await window.publicApp.pluginManager.remove(plugin.path)
      this.settings.plugins = this.settings.plugins.filter(({ path }) => path !== plugin.path)
      this.$message.success('插件移除成功')
      this.saveSettings()
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
      await window.publicApp.registerShortcuts({
        shortcuts: this.settings.shortcuts
      })
      this.saveSettings()
    }
  }
})

window.app = app