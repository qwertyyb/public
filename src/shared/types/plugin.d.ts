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

export interface PublicApp {
    getMainWindow: () => BrowserWindow,
    hideMainWindow: () => void,
    enterPlugin: () => void,
    getUtils: () => Utils,
    setList: (list: CommonListItem[]) => void,
    db: {
      run: (sql, params?) => Promise<any>,
      all: (sql, params?) => Promise<Array>,
      get: (sql, params?) => Promise<Any>
    },
    storage: {
      setItem: (key: string, value: string) => Promise<typeof value>,
      getItem: (key: string) => Promise<any>,
      removeItem: (key: string) => Promise<void>,
      clear: (prefix: string) => Promise<void>
    }
}
