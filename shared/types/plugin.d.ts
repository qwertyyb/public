import { BrowserWindow } from "electron";
import { CoreApp } from "index"
import type { CommonListItem, PublicPlugin } from ".";
import { PortBridge } from "app/utils";


interface SetResult {
  (list: CommonListItem[]): void
}

interface ListItem {
  title: string,
  icon?: string,
  subtitle?: string,
  [propName: string]: any
}

interface CommonListItem extends ListItem {
  code?: string,
  preview?: string,
  key: string | number,
  onSelect?: () => void,
  onEnter?: (item: CommonListItem, index: number, list: CommonListItem[]) => void,
  [propName: string]: any;
}

export interface PublicPlugin {
  onInput?: (keyword: string) => void,
  onSelect?: (command: PluginCommand, keyword: string) => string | HTMLElement | Promise<string> | Promise<HTMLElement>,
  onEnter?: (item: PluginCommand, keyword: string) => void
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

    enter: (item: CommonListItem, args: any) => Promise<PortBridge>,
    exit: () => Promise<void>
}

export interface TriggerPluginCommandMatch {
  type: 'trigger' // text | regexp
  triggers: string[]
  title?: string
  subtitle?: string
}
export interface TextPluginCommandMatch {
  type: 'text'
  keywords: string[]
}

export interface FullPluginCommandMatch {
  type: 'full'
  title?: string
  subtitle?: string
}

export type PluginCommandMatch = TextPluginCommandMatch | TriggerPluginCommandMatch | FullPluginCommandMatch

export interface PluginCommand extends ListItem {
  name: string
  mode?: 'listView' | 'none' | 'view',
  matches: PluginCommandMatch[],
  entry?: string,

  [index: string]: any
}

export interface PluginManifest extends Required<ListItem> {
  name: string
  descript?: string,
  commands?: PluginCommand[]
  entry?: string
}
