import type { ICommandSettings, IPluginSettings, IRunningPlugin, ISettings } from "@public/shared"

// export const getSettings = () => window.PublicAppBridge?.invoke('getSettings')

// export const updateSettings = (settings: Partial<ISettings>) => window.PublicAppBridge?.invoke('updateSettings', settings)

// export const getPlugins = () =>
//   window.PublicAppBridge?.invoke<Omit<IRunningPlugin, 'plugin'>[]>('getPlugins')

// export const updatePluginSettings = (plugin: string, settings: { disabled: boolean }) => window.PublicAppBridge?.invoke('updatePluginSettings', plugin, settings)

// export const updateCommandSettings = (plugin: string, command: string, settings: ICommandSettings) => window.PublicAppBridge?.invoke('updateCommandSettings', plugin, command, settings)

// export const removePlugin = (plugin: string) => window.PublicAppBridge?.invoke('removePlugin', plugin)

// export const openPreferences = (plugin: string, command?: string) => window.PublicAppBridge?.invoke('openPreferences', plugin, command)

export const getSettings = async (): Promise<ISettings> => {
  const defaultSettings = {
    launchAtLogin: true,
    shortcuts: 'Meta+Meta',
    clearTimeout: 90,
  }
  const settings = await window.publicApp.storage.getItem<Partial<ISettings>>('settings/settings')
  return {
    ...defaultSettings,
    ...settings
  }
}

export const updateSettings = (settings: Partial<ISettings>) => {
  window.publicApp.storage.setItem('settings/settings', settings)
}

export const getPlugins = () => Promise.resolve([...window.pluginManager?.getPlugins({ includeDisabledPlugins: true, includeDisabledCommand: true }).values() ?? []]).then(list => {
  return list.sort((prev, next) => prev.manifest.name.localeCompare(next.manifest.name))
})

export const updatePluginSettings = (plugin: string, settings: Partial<Omit<IPluginSettings, 'commands'>>) => {
  window.pluginManager?.updatePluginSettings(plugin, settings);
}

export const updateCommandSettings = (plugin: string, command: string, settings: ICommandSettings) => window.pluginManager?.updateCommandSettings(plugin, command, settings)

export const removePlugin = (plugin: string) => window.pluginManager?.unregisterPlugin(plugin)

export const openPreferences = (plugin: string, command?: string) => window.publicApp.plugin.openPreferences(plugin, command)

export const unregisterShortcuts = (shortcuts: string) => {
  window.PublicApp.mainAPI.shortcuts.unregister(shortcuts)
}

export const registerCommandShortcuts = (shortcuts: string, plugin: string, command: string) => {
  // 需要处理快捷键
  window.PublicApp.mainAPI.shortcuts.register(shortcuts, () => {
    window.PublicApp.mainAPI.plugin.enterCommand(plugin, command, { from: 'hotkey', keyword: '', query: '', score: 0 })
    window.PublicApp.mainAPI.mainWindow.show()
  })
}
