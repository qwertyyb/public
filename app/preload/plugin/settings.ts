import { join as pathJoin } from 'path'
import type { IPluginsSettings, ISettings } from '@public/shared'

const names = [
  'launcher', 'command', 'calculator', 'qrcode', 'search', 'translate', 'clipboard',
  'douban', 'magic', 'ai-chat', 'v2ex', 'terminal', 'find', 'google-chrome', 'mdn', 'shortcuts', 'transform',
]

const getDefaultSettings = (): ISettings => {
  const getDefaultPluginPaths = () => {
    return names.map(name => ({ path: pathJoin(__dirname, '../../', name) }))
  }

  return {
    launchAtLogin: true,
    shortcuts: 'Meta+Meta',
    clearTimeout: 90,
    pluginsPathList: getDefaultPluginPaths(),
    pluginsSettings: {} as IPluginsSettings
  }
}

export const getSettings = async () => {
  const value = await window.publicApp.storage.getItem<ISettings>('settings')
  return {
    ...getDefaultSettings(),
    ...value,
  }
}

export const setSettings = () => {
  // @todo 
}