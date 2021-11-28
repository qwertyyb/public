import { BrowserWindow, Common, ipcRenderer, webContents } from "electron"
import { PublicApp, PublicPlugin } from './plugin'

declare global {
  var ResizeObserver: any
  var ipcRenderer: typeof ipcRenderer
  var rendererIpc: {
    invoke: (webContentsId: number, channel: string, args: any) => Promise<any>,
    handle: (channel: string, listener: (event: Electron.IpcRendererEvent, args: any) => any) => any,
  }
  declare const __non_webpack_require__: any;
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    removePlugin: (path: string) => void,
    registerPlugin: (path: string) => void,

    handleQuery: (keyword: string) => void,
    handleEnter: (
      pluginPath: string,
      args: {
        item: CommonListItem,
        index: number,
        list: CommonListItem[]
      }
    ) => void,
  }


  var publicApp: PublicApp
}
