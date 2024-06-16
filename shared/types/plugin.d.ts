import { BrowserWindow } from "electron";
import { CoreApp } from "index"
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

export interface PublicPlugin {
  onInput?: (keyword: string) => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void,
  getResultPreview?: (item: CommonListItem, index: number, list: CommonListItem[]) => void | Promise<string | undefined>, 
}

export interface PublicApp {
    getApp: () => CoreApp,
    getMainWindow: () => BrowserWindow,
    getUtils: () => Utils,
    setList: (list: CommonListItem[]) => void,
    robot: any,
    db: {
      run: (sql, params?) => Promise<any>,
      all: (sql, params?) => Promise<Array>,
      get: (sql, params?) => Promise<Any>
    }
}
