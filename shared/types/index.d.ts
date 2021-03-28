import { BrowserWindow, Common, ipcRenderer } from "electron"
import { PublicPlugin } from './plugin'

declare global {
  var ResizeObserver: any
  var ipcRenderer: typeof ipcRenderer
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    handleQuery: (keyword: string) => void,
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
