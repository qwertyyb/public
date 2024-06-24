import { BrowserWindow } from "electron";
import { CoreApp } from "index"
import type { CommonListItem, PublicPlugin } from ".";


interface SetResult {
  (list: CommonListItem[]): void
}

interface CommonListItem {
  code?: string,
  title: string,
  subtitle?: string,
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

interface RunningPublicPlugin {
  plugin: PublicPlugin
  path: string
  pkg: any
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
    },

    enter: (item: CommonListItem, args: any) => Promise<MessagePort>,
    exit: () => Promise<void>
}

export interface PluginCommandMatch {
  type: 'text', // text | regexp
  match: string[],
  title?: string,
}

export interface PluginCommand {
  name: string
  icon?: string
  title?: string
  subtitle?: string
  mode?: 'listView',
  matches: PluginCommandMatch[],
  entry?: string
}

export interface PluginManifest {
  icon: string
  title: string
  subtitle?: string,
  descript?: string,
  commands?: PluginCommand[]
  entry?: string
}
