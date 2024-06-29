import { ipcRenderer } from "electron"
import createAPI from './preload/preload.api'
import type { ListItem, PluginCommand } from "shared/types/plugin"
import { createBridge } from "./utils/index"

declare global {
  interface PublicApp {
    setList?: (list: ListItem[]) => void,
  }

  interface Window {
    bridge: typeof pluginBridge,
    pluginData: { list: ListItem[] | null },
    launchParameter: {
      command: PluginCommand,
      query?: string,
      options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
    },
    command: PluginCommand,
    plugin?: any,
  }
}

const parameters: {
  command: PluginCommand,
  query?: string,
  options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
} = JSON.parse(process.argv[process.argv.length - 1])

window.command = parameters.command
window.launchParameter = parameters

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

window.pluginData = {
  list: null
}
window.publicApp = {
  ...createAPI(),
  setList: (list) => {
    window.dispatchEvent(new CustomEvent('listchanged', { detail: { list } }))
    window.pluginData.list = list
  }
}

const preload = parameters.options.preload
if (preload) {
  const plugin = __non_webpack_require__(preload)

  window.plugin = plugin?.default || plugin
  
  if (!window.plugin?.search) {
    // 没有 search 函数，禁用输入框
    controlBridge.invoke('inputBar.disable', { disable: true })
  }
}

window.bridge = pluginBridge
