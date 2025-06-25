import { ipcRenderer } from "electron"
import { type PortBridge, IPluginCommand, IResultItem, IPluginCommandListView } from '@public/shared'
import createCommonAPI, { createDraggable } from './preload/preload.common'
import { createBridge } from '@public/utils'

declare global {
  interface Window {
    bridge?: PortBridge
    pluginData: { list: IResultItem[] | null }
    plugin?: IPluginCommandListView
    pluginService?: {
      setList: (list: IResultItem[]) => void
    }
    publicAppCommandMeta?: {
      plugin: { name: string, title: string, icon: string },
      command: { name: string, title: string, icon: string },
      pluginPreferences: Record<string, any>,
      commandPreferences: Record<string, any>
    }
    PublicAppBridge?: ReturnType<typeof createBridge>
  }
}

window.pluginData = { list: null }

// 这个 bridge 给插件用
window.PublicAppBridge = createBridge(
  (payload) => ipcRenderer.sendToHost('bridgeMessage', payload),
  (callback) => ipcRenderer.on('bridgeMessage', (event, payload) => callback(payload)),
)

// 这个 bridge 给 APP 使用
const innerBridge = createBridge(
  (payload) => ipcRenderer.sendToHost('innerBridgeMessage', payload),
  (callback) => ipcRenderer.on('innerBridgeMessage', (event, payload) => callback(payload)),
)

createDraggable()

const api = createCommonAPI()
window.publicApp = {
  ...api,
  plugin: {
    ...api.plugin,
    getPreferenceValues<D extends any>(commandName?: string) {
      return innerBridge.invoke<D>('getPreferenceValues', commandName)
    },
    openPreferences(commandName?: string) {
      return innerBridge.invoke('openPreferences', commandName)
    },
    getLaunchData() {
      return innerBridge.invoke('getLaunchData')
    }
  },
  mainWindow: {
    ...api.mainWindow,
    popToRoot(options) {
      innerBridge.invoke('popToRoot', options)
    },
  }
}

window.PublicAppBridge = createBridge(
  (payload) => window.publicApp.sendToHost('bridgeMessage', payload),
  (callback) => window.publicApp.onHostMessage('bridgeMessage', (event, payload) => callback(payload)),
)

window.pluginService = {
  setList: (list) => {
    window.pluginData.list = list
    window.dispatchEvent(new CustomEvent('listchanged', { detail: { list } }))
  }
}

window.CSS.registerProperty({
  name: '--nav-height',
  syntax: '<length>',
  inherits: true,
  initialValue: '48px'
})

window.CSS.registerProperty({
  name: '--nav-width',
  syntax: '<length>',
  inherits: true,
  initialValue: '48px'
})
