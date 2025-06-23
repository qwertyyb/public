import { ipcRenderer } from "electron"
import { type PortBridge, IPluginCommand, IResultItem, IPluginCommandListView } from '@public/shared'
import createCommonAPI from './preload/preload.common'
import { createBridge } from "./utils/index"

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
  }
}

ipcRenderer.on('meta', (event, meta) => {
  console.log('setMeta')
  window.publicAppCommandMeta = meta
})

const initMeta = () => {
  console.log('initMeta')
  ipcRenderer.sendToHost('initMeta')
  console.log('afterInitMeta')
}

console.log('argv', process.argv)
initMeta()

const initBridge = () => {
  const controlBridge = createBridge()
  const pluginBridge = createBridge()
  ipcRenderer.on('port', event => {
    const [port2, controlPort2] = event.ports
    controlBridge.setPort(controlPort2)
    pluginBridge.setPort(port2)
  })
  return { controlBridge, pluginBridge } 
}


const { controlBridge, pluginBridge } = initBridge()

controlBridge.handle('setInputValue', async (data: { value: string }) => {
  window.dispatchEvent(new CustomEvent('inputBar.setValue', { detail: data }))
})

window.pluginData = { list: null }
window.publicApp = createCommonAPI()
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

window.bridge = pluginBridge
