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


  var publicApp: {
    getMainWindow: () => Electron.BrowserWindow,
    db: {
      run: (sql, params?) => Promise<any>,
      all: (sql, params?) => Promise<Array>,
      get: (sql, params?) => Promise<Any>
    }
  }
}
