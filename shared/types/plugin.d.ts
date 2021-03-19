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
  title: string,
  icon: string,
  subtitle: string,
  onInput?: (keyword: string, setResult: SetResult) => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void
}

export interface PublicApp {
    getApp: () => CoreApp,
    getMainWindow: () => BrowserWindow,
    getPlugins: () => PublicPlugin[],
    getUtils: () => Utils,
    setList: (list: CommonListItem[]) => void,
    robot: any,
}