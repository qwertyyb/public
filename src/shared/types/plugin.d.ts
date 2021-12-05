import { BrowserWindow } from "electron";
import { CoreApp } from "src/shared/types/index"
import { CommonListItem, PublicPlugin } from ".";


interface SetResult {
  (list: CommonListItem[]): void
}

interface CommonListItem {
  code?: string,
  title: string,
  subtitle: string,
  preview?: string,
  icon: string,
  key: string | number,
  onSelect?: () => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void,
  [propName: string]: any;
}

interface PublicPluginConfig {
  title: string,
  icon: string,
  subtitle: string,
  entry?: string
}

interface PublicPlugin {
  title: string,
  icon: string,
  subtitle: string,
  onInput?: (keyword: string) => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void,
  getResultPreview?: (item: CommonListItem, index: number, list: CommonListItem[]) => void | Promise<string | undefined>, 
}

interface MessageData {
  channel: string,
  args: any,
  callbackName: string,
}

export interface PublicApp {
    simulate: any,
    enterPlugin: () => any,
    getUtils: () => Utils,
    exitPlugin: () => any,
    setList: (list: CommonListItem[]) => any,
    db: {
      run: (sql, params?) => Promise<any>,
      all: (sql, params?) => Promise<any>,
      get: (sql, params?) => Promise<any>
    },
    storage: {
      setItem: (key: string, value: string) => Promise<typeof value>,
      getItem: (key: string) => Promise<string>,
      removeItem: (key: string) => Promise<void>,
      clear: (prefix: string) => Promise<void>
    },
    hideMainWindow: () => Promise<void>,
    registerShortcuts: Function,
    enableLaunchAtLogin: (enable: boolean) => Promise<void>,
    storage: any,
    pluginManager: any
}
