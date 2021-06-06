import { BrowserWindow, Common, ipcRenderer, webContents } from "electron"
import { PublicPlugin } from './plugin'

declare global {
  var ResizeObserver: any
  var ipcRenderer: typeof ipcRenderer
  var rendererIpc: {
    invoke: (webContentsId: number, channel: string, args: any) => Promise<any>,
    handle: (channel: string, listener: (event: Electron.IpcRendererEvent, args: any) => any) => any,
  }
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    removePlugin: (index: number) => void,
    registerPlugin: ({ path }: { path: string }) => void,

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
