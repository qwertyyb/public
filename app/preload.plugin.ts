import { ipcRenderer } from "electron"
import createAPI from './preload/preload.api'
import { type PortBridge, createBridge } from "./utils/index"

declare global {
  interface Window {
    bridge?: PortBridge
    launchParameter: {
      command: IPluginCommand
      query?: string
      options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
    }
    pluginData: { list: IResultItem[] | null }
    plugin?: IPluginCommandListView
    pluginService?: {
      setList: (list: IResultItem[]) => void
    }
  }
}

const parameters: {
  command: IPluginCommand,
  query?: string,
  options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
} = JSON.parse(process.argv[process.argv.length - 1])

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

window.pluginData = { list: null }
window.publicApp = createAPI()
window.pluginService = {
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
