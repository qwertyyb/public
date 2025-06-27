import type { IPluginSettings, IRunningPlugin, PortBridge } from "@public/shared"

declare global {
  interface Window {
    bridge?: PortBridge
  }
}

export const getPlugin = (name: string) => window.bridge?.invoke<IRunningPlugin>('getPlugin', name)

export const getPluginSettings = (name: string) => window.bridge?.invoke<IPluginSettings>('getPluginSettings', name)

export const updatePluginSettings = (name: string, settings: IPluginSettings) => window.bridge?.invoke('updatePluginSettings', name, settings)

export const getSettings = () => window.bridge?.invoke('getSettings')

export const updateSettings = (settings: any) => window.bridge?.invoke('updateSettings', settings)

export const getPlugins = () => window.bridge?.invoke<IRunningPlugin[]>('getPlugins')

export const registerShortcuts = (settings: any) => window.bridge?.invoke('registerShortcuts', settings)

export const registerLaunchAtLogin = (settings: any) => window.bridge?.invoke('registerLaunchAtLogin', settings)

export const removePlugin = (options: { index: number, plugin: IRunningPlugin}) => window.bridge?.invoke('removePlugin', options)