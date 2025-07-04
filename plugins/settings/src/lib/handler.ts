import { IBridge, ICommandSettings, IPluginSettings, IRunningPlugin } from '@public/shared'

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
  const settings = await window.publicApp.storage.getItem<Partial<ISettings>>('settings')
  return {
    ...defaultSettings,
    ...settings
  }
}

const updateSettings = async (settings: Partial<ISettings>) => {
  const oldValue = await window.publicApp.storage.getItem<ISettings>('settings')
  return window.publicApp.storage.setItem('settings', { ...oldValue, ...settings })
}

const registerShortcuts = (shortcuts: string) => {
  // 主快捷键
  window.publicApp.shortcuts.register(shortcuts, () => window.publicApp.mainWindow.show())
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
        const plugin = window.pluginManager?.getPlugins().get(pluginName);
        if (plugin && command) {
          window.publicApp.mainWindow.show();
          window.pluginManager?.enterPluginCommand(plugin, command, {
            owner: plugin,
            score: 1,
            from: "hotkey",
            keyword: "",
            query: "",
          });
        }
      };
      shortcutsHandlers.set(shortcuts, handler);
      window.publicApp.shortcuts.register(shortcuts, handler);
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
    window.publicApp.mainWindow.popToRoot({ clearInput: true })
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
      window.publicApp.shortcuts.unregister(original.shortcuts, shortcutsHandlers.get(original.shortcuts)!)
      shortcutsHandlers.delete(original.shortcuts)
    }
    if (settings.shortcuts && pluginInstance) {
      shortcutsHandlers.set(settings.shortcuts, () => {
        window.pluginManager?.enterPluginCommand(
          pluginInstance,
          pluginInstance?.commands.find((c) => c.name === command)!,
          { owner: pluginInstance, score: 1, from: "hotkey", keyword: "", query: "" }
        );
        window.publicApp.mainWindow.show();
      })
      window.publicApp.shortcuts.register(settings.shortcuts, shortcutsHandlers.get(settings.shortcuts)!)
    }
    window.pluginManager?.updateCommandSettings(plugin, command, settings)
  },
  openPreferences(plugin: string, command?: string) {
    window.publicApp.plugin.openPreferences(plugin, command)
  }
}

const initHandler = (bridge: IBridge) => {
  Object.entries(handlers).forEach(([name, cb]) => bridge.handle(name, cb))
}

export { initHandler, initSettings }
