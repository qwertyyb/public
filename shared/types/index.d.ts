import { BrowserWindow, Common, ipcRenderer } from "electron"

declare global {
  var ResizeObserver: any
  var ipcRenderer: typeof ipcRenderer
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    handleInput: (keyword: string, setResult: (plugin: PublicPlugin, list: CommonListItem[]) => void) => void,
    handleEnter: (
      plugin: PublicPlugin,
      args: {
        item: CommonListItem,
        index: number,
        list: CommonListItem[]
      }
    ) => void,
  }
}
