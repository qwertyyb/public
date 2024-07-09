import { queryRecord, updateRecord, createDatabase } from './storage'
import * as path from 'path'

const names = [
  'launcher', 'command', 'calculator', 'qrcode', 'search', 'translate', 'clipboard',
  'douban', 'magic', 'ai-chat', 'v2ex', 'terminal', 'find', 'google-chrome', 'mdn', 'shortcuts', 'transform',
]

const getDefaultSettings = () => {
  const getDefaultPluginPaths = () => {
    return names.map(name => ({ path: path.join(__dirname, '../../', name) }))
  }

  return {
    launchAtLogin: true,
    shortcuts: 'Meta+Space',
    clearTimeout: 90,
    pluginsPathList: getDefaultPluginPaths(),
    pluginsSettings: {} as IPluginsSettings
  }
}

type Settings = ReturnType<typeof getDefaultSettings>

let shortcutsData: Record<string, { pluginName?: string, commandName?: string }> = {}

window.addEventListener('publicApp.shortcuts', (event: CustomEvent<{ shortcuts: string }>) => {
  const { shortcuts } = event.detail;
  const target = shortcutsData[shortcuts]
  if (!target) return
  window.publicApp.mainWindow.show()
  if (!target.pluginName) return
  const plugin = window.pluginManager.getPlugins().get(target.pluginName)
  const command = plugin?.commands.find(item => item.name === target.commandName)
  if (command) {
    window.pluginManager.enterPluginCommand(plugin, command)
  }
})

const registerShortcuts = (settings: Settings) => {
  // 主快捷键
  const { shortcuts } = settings;
  shortcutsData = {}
  shortcutsData[shortcuts.split('+').sort().join('+')] = {}
  // 命令快捷键
  Object.entries(settings.pluginsSettings).forEach(([pluginName, pluginSetting]) => {
    if (pluginSetting?.disabled) return
    Object.entries(pluginSetting?.commands || {}).forEach(([commandName, commandSettings]) => {
      if (commandSettings?.disabled) return
      const shortcuts = commandSettings?.shortcuts
      if (shortcuts) {
        shortcutsData[shortcuts.split('+').sort().join('+')] = { pluginName, commandName }
      }
    })
  })
  console.log('shortcuts', shortcutsData)
}

let clearIntervalTime: number = 0
let timeout: ReturnType<typeof setTimeout> | null = null
window.addEventListener('publicApp.mainWindow.hide', (event) => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  console.log('clearIntervalTime', clearIntervalTime)
  if (clearIntervalTime < 0) return
  timeout = setTimeout(() => {
    window.publicApp.exit()
    window.publicApp.inputBar.setValue('')
  }, clearIntervalTime * 1000)
})
window.addEventListener('publicApp.mainWindow.show', () => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
})
window.addEventListener('publicApp.mainWindow.blur', () => {
  window.publicApp.mainWindow.hide()
})
const registerClearInterval = (settings: Settings) => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  clearIntervalTime = settings.clearTimeout
}

const registerLaunchAtLogin =(settings: any) => {
  // 启动项
  require('@electron/remote').app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin
  })
}

const getSettings = async (): Promise<Settings> => {
  let value = await createDatabase().then(() => queryRecord({ key: 'config' })).then(res => res?.value)
  if (!value) {
    const value = getDefaultSettings()
    updateRecord({ key: 'config', value })
  }
  return {
    ...value,
    pluginsPathList: getDefaultSettings().pluginsPathList
  }
}

const updateSettings = async (settings: Settings) => {
  console.log('updateSettings', settings)
  return updateRecord({ key: 'config', value: settings })
}

const initPlugins = async (settings: Settings) => {
  const plugins = settings.pluginsPathList || []
  return plugins.map((p: any) => {
    try {
      window.pluginManager.addPlugin(p.path)
    } catch(err) {
      console.warn(err);
    }
  })
}

const initPluginsSettings = async (pluginsSettings: IPluginsSettings) => {
  window.pluginManager.updatePluginsSettings(pluginsSettings)
}

const initSettings = async () => {
  console.log('initSettings')
  const settings = await getSettings()
  registerLaunchAtLogin(settings)
  registerShortcuts(settings)
  registerClearInterval(settings)
  initPlugins(settings)
  initPluginsSettings(settings.pluginsSettings)
}

// const updatePluginsSettings = async () => {
//   const pluginConfigs = JSON.parse(JSON.stringify(window.pluginManager.getPlugins()))
//   const settings = await getSettings();

//   settings.plugins = pluginConfigs

//   return updateSettings(settings)
// }

const handlers = {
  async registerShortcuts(args) {
    console.log('register shortcuts', args)
    await updateSettings(args.settings)
    registerShortcuts(args.settings)
  },
  async registerLaunchAtLogin(args) {
    await updateSettings(args.settings)
    registerLaunchAtLogin(args.settings)
  },
  async removePlugin(args: { path: string, name: string }) {
    window.pluginManager.removePlugin(args.name);
    // await updatePluginsSettings()
  },
  async registerPlugin(args) {
    window.pluginManager.addPlugin(args.path)
    // await updatePluginsSettings()
  },
  getPlugins() {
    return JSON.parse(JSON.stringify(Array.from(window.pluginManager.getPlugins().values())))
  },
  getSettings() {
    return getSettings()
  },
  async updateSettings(args: { settings: Settings }) {
    console.log('updateSettings', args.settings)
    await updateSettings(args.settings)
    await initSettings()
  }
}

const initHandler = (bridge) => {
  Object.keys(handlers).forEach(name => {
    bridge.handle(name, handlers[name])
  })
}

export { initHandler, initSettings }
