import { updateRecord } from './storage'
import * as path from 'path'

const names = [
  'launcher', 'command', 'calculator', 'qrcode', 'search', 'translate', 'clipboard',
  'douban', 'magic', 'ai-chat', 'v2ex', 'terminal', 'find', 'google-chrome', 'mdn', 'shortcuts'
]

const getDefaultSettings = () => {
  const getDefaultPluginPaths = () => {
    return names.map(name => ({ path: path.join(__dirname, '../../', name) }))
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

const registerShortcuts = (settings: any) => {
  const { shortcut, shortcuts } = settings;
  const list = [
    { shortcut, keyword: '' },
    ...shortcuts
  ]
  const remote = require('@electron/remote')
  const globalShortcut = remote.globalShortcut
  globalShortcut.unregisterAll()
  list.forEach(({ keyword, shortcut, temp }) => {
    shortcut && !temp && globalShortcut.register(shortcut, () => {
      window.publicApp.mainWindow.show()
      window.publicApp.inputBar.setValue(keyword)
    })
  })
}

const registerLaunchAtLogin =(settings: any) => {
  // 启动项
  require('@electron/remote').app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin
  })
}

const getSettings = async () => {
  // let value = await createDatabase().then(() => queryRecord({ key: 'config' })).then(res => res?.value)
  // if (!value) {
    const value = getDefaultSettings()
    // updateRecord({ key: 'config', value })
  // }
  return value
}

const updateSettings = async (settings: any) => {
  return updateRecord({ key: 'config', value: settings })
}

const initPlugins = async (settings: any) => {
  const plugins = settings.plugins || []
  console.log(settings)
  return plugins.map((p: any) => {
    try {
      window.pluginManager.addPlugin(p.path)
    } catch(err) {
      console.warn(err);
    }
  })
}

const initSettings = async () => {
  console.log('initSettings')
  const settings = await getSettings()
  registerLaunchAtLogin(settings)
  registerShortcuts(settings)

  initPlugins(settings)
}

const updatePluginsSettings = async () => {
  const pluginConfigs = JSON.parse(JSON.stringify(window.pluginManager.getPlugins()))
  const settings = await getSettings();

  settings.plugins = pluginConfigs

  return updateSettings(settings)
}

const handlers = {
  async registerShortcuts(args) {
    await updateSettings(args.settings)
    registerShortcuts(args.shortcuts)
  },
  async registerLaunchAtLogin(args) {
    await updateSettings(args.settings)
    registerLaunchAtLogin(args.settings)
  },
  async removePlugin(args) {
    window.pluginManager.removePlugin(args.name);
    await updatePluginsSettings()
  },
  async registerPlugin(args) {
    window.pluginManager.addPlugin(args.path)
    await updatePluginsSettings()
  },
  getPlugins() {
    return JSON.parse(JSON.stringify(Array.from(window.pluginManager.getPlugins().values())))
  },
  getSettings() {
    return getSettings()
  },
}

const initHandler = (bridge) => {
  Object.keys(handlers).forEach(name => {
    bridge.handle(name, handlers[name])
  })
}

export { initHandler, initSettings }
