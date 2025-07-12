import { IBridge, ICommandSettings, IPluginSettings, IRunningPlugin } from '@public/shared'
import api from '@public/api'

interface ISettings {
  launchAtLogin: boolean,
  shortcuts: string,
  clearTimeout: number, // 秒
  pluginsPathList: string[]
}

const getSettings = async (): Promise<ISettings> => {
  const defaultSettings = {
    launchAtLogin: true,
    shortcuts: 'Meta+Meta',
    clearTimeout: 90,
    pluginsPathList: [],
  }
  const settings = await api.storage.getItem<Partial<ISettings>>('settings')
  return {
    ...defaultSettings,
    ...settings
  }
}

const updateSettings = async (settings: Partial<ISettings>) => {
  const oldValue = await api.storage.getItem<ISettings>('settings')
  return api.storage.setItem('settings', { ...oldValue, ...settings })
}

const registerShortcuts = (shortcuts: string) => {
  // 主快捷键
  api.shortcuts.register(shortcuts, () => api.mainWindow.show())
}

const shortcutsHandlers = new Map<string, () => void>()
const registerCommandShortcuts = (plugins: Map<string, IRunningPlugin>) => {
  plugins.entries().forEach(([pluginName, plugin]) => {
    if (plugin.settings?.disabled) return
    plugin?.commands.forEach((command) => {
      const commandSettings = plugin.settings?.commands?.[command.name]
      if (commandSettings?.disabled) return
      const shortcuts = commandSettings?.shortcuts
      if (!shortcuts) return
      const handler = () => {
        window.PublicApp.mainAPI.plugin.enterCommand(pluginName, command.name, { from: 'hotkey', score: 0, keyword: '', query: '' })
        api.mainWindow.show();
      };
      api.shortcuts.register(shortcuts, handler);
    })
  })
}

let clearIntervalTime: number = 0
let timeout: ReturnType<typeof setTimeout> | null = null
window.addEventListener('publicApp.mainWindow.hide', (event) => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  console.log('clearIntervalTime', clearIntervalTime)
  if (clearIntervalTime <= 0) return
  timeout = setTimeout(async () => {
    api.mainWindow.popToRoot({ clearInput: true })
  }, clearIntervalTime * 1000)
})
window.addEventListener('publicApp.mainWindow.show', () => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
})
window.addEventListener('publicApp.mainWindow.blur', () => {
  api.mainWindow.hide()
})
const registerClearInterval = (expectTimeout: number) => {
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
  clearIntervalTime = expectTimeout
}

const registerLaunchAtLogin =(enable: boolean) => {
  // 启动项
  require('@electron/remote').app.setLoginItemSettings({
    openAtLogin: enable
  })
}

const initSettings = async () => {
  const settings = await getSettings()
  registerLaunchAtLogin(settings.launchAtLogin)
  registerShortcuts(settings.shortcuts)
  registerClearInterval(settings.clearTimeout)
  const plugins = window.pluginManager?.getPlugins()
  if (!plugins) return;
  registerCommandShortcuts(plugins)
}

const handlers = {
  async registerShortcuts(shortcuts: string) {
    updateSettings({ shortcuts })
    registerShortcuts(shortcuts)
  },
  async registerLaunchAtLogin(enable: boolean) {
    updateSettings({ launchAtLogin: enable })
    registerLaunchAtLogin(enable)
  },
  async updateClearTimeout(timeout: number) {
    updateSettings({ clearTimeout: timeout })
    registerClearInterval(timeout)
  },
  async removePlugin(args: { path: string, name: string }) {
    window.pluginManager?.unregisterPlugin(args.name);
  },
  async registerPlugin(args: { path: string }) {
    window.pluginManager?.registerPlugin(args.path)
  },
  getPlugins() {
    return JSON.parse(JSON.stringify(Array.from(window.pluginManager!.getPlugins({ includeDisabledPlugins: true, includeDisabledCommand: true }).values())))
  },
  getSettings,
  getPlugin(name: string) {
    return window.pluginManager?.getPlugins({ includeDisabledPlugins: true, includeDisabledCommand: true }).get(name)
  },
  async getPluginSettings(name: string) {
    return window.pluginManager?.getPlugins({ includeDisabledPlugins: true, includeDisabledCommand: true }).get(name)?.settings
  },
  async updatePluginSettings(name: string, pluginSettings: IPluginSettings) {
    window.pluginManager?.updatePluginSettings(name, pluginSettings)
  },
  async updateCommandSettings(plugin: string, command: string, settings: ICommandSettings) {
    // 需要处理快捷键
    const pluginInstance = window.pluginManager?.getPlugins({
        includeDisabledPlugins: true,
        includeDisabledCommand: true,
      })
      .get(plugin);
    const original = pluginInstance?.settings?.commands?.[command]
    if (original?.shortcuts && original.shortcuts !== settings.shortcuts && shortcutsHandlers.get(original.shortcuts)) {
      api.shortcuts.unregister(original.shortcuts)
      shortcutsHandlers.delete(original.shortcuts)
    }
    if (settings.shortcuts && pluginInstance) {
      shortcutsHandlers.set(settings.shortcuts, () => {
        window.PublicApp.mainAPI.plugin.enterCommand(plugin, command, { from: 'hotkey', keyword: '', query: '', score: 1 })
        api.mainWindow.show();
      })
      api.shortcuts.register(settings.shortcuts, shortcutsHandlers.get(settings.shortcuts)!)
    }
    window.pluginManager?.updateCommandSettings(plugin, command, settings)
  },
  openPreferences(plugin: string, command?: string) {
    window.PublicApp.mainAPI.plugin.openPreferences(plugin, command)
  }
}

const initHandler = (bridge: IBridge) => {
  Object.entries(handlers).forEach(([name, cb]) => bridge.handle(name, cb))
}

export { initHandler, initSettings }
