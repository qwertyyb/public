import type { ICommandSettings, IRunningPlugin, ISettings } from "@public/shared"

export const getSettings = () => window.PublicAppBridge?.invoke('getSettings')

export const updateSettings = (settings: Partial<ISettings>) => window.PublicAppBridge?.invoke('updateSettings', settings)

export const getPlugins = () =>
  window.PublicAppBridge?.invoke<Omit<IRunningPlugin, 'plugin'>[]>('getPlugins')

export const updatePluginSettings = (plugin: string, settings: { disabled: boolean }) => window.PublicAppBridge?.invoke('updatePluginSettings', plugin, settings)

export const updateCommandSettings = (plugin: string, command: string, settings: ICommandSettings) => window.PublicAppBridge?.invoke('updateCommandSettings', plugin, command, settings)

export const removePlugin = (plugin: string) => window.PublicAppBridge?.invoke('removePlugin', plugin)

export const openPreferences = (plugin: string, command?: string) => window.PublicAppBridge?.invoke('openPreferences', plugin, command)

