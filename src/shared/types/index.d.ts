import { BrowserWindow, Common, ipcRenderer, webContents } from "electron"
import { PublicApp, PublicPlugin } from './plugin'

declare global {
  interface Command {
    name: string,
    title: string,
    subtitle: string,
    description: string,
    icon: string,
    mode: string,
    entry: string,
  }

  interface Config {
    name: string,
    title: string,
    subtitle: string,
    description: string,
    icon: string,
    preload?: string,
    entry: string,
    commands: Command[]
  }

  interface RunningPlugin {
    worker: Worker,
    path: string,
    config: Config,
    handler: (e: MessageEvent<MessageData> | IpcMessageEvent) => any
  }

  interface RunningCommand {
    command: Command,
    plugin: RunningPlugin
  }


  var ResizeObserver: any
  var ipcRenderer: typeof ipcRenderer
  var rendererIpc: {
    invoke: (webContentsId: number, channel: string, args: any) => Promise<any>,
    handle: (channel: string, listener: (event: Electron.IpcRendererEvent, args: any) => any) => any,
  }
  declare const __non_webpack_require__: any;
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    getPlugin: (name: string) => RunningPlugin;
    removePlugin: (path: string) => void,
    registerPlugin: (path: string) => RunningPlugin,
    exitPlugin: (name: string) => void

    handleQuery: (keyword: string) => void,
    handleEnter: (name: string, item: RunningCommand) => void,
  }


  var publicApp: PublicApp
}

namespace globalThis {
  const publicApp: PublicApp
}
