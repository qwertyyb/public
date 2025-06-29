import { IActionItem, ICommandMatchData, ICommandSettings, IPluginCommand, IPluginCommandListView, IPluginSettings, IPluginsSettings, IRunningPlugin } from './plugin'
import { PortBridge } from './utils'
import { IWebview, IWebviewElement, IWebviewEventMap, IWebviewTagAttributes } from './webview'

export * from './plugin.d.ts'
export * from './utils'
export * from './webview'

export interface IWebviewProps { src: string, preload?: string, nodeintegration?: boolean, nodeintegrationinsubframes?: boolean, httpreferrer?: string, useragent?: string, disablewebsecurity?: boolean, webpreferences?: string }

export interface IBridge {
  invoke: <R extends any>(method, ...args: any[]) => Promise<R>,
  handle: (channel: string, callback: (...args: any[]) => any) => void,
  unhandle: (channel: string) => void,
}

export interface IPublicApp {
  db: {
    run: (sql: string, params?) => Promise<any>,
    all: (sql: string, params?) => Promise<Array<any>>,
    get: (sql: string, params?) => Promise<any>
  },
  sqlite: {
    run: (dbPath: string, sql: string, params: Object) => Promise<any>,
  }
  mainWindow: {
    show: () => Promise<void>,
    hide: () => Promise<void>,
    pushView: (options: { path: string, params?: any }) => void
    popToRoot: (options?: { clearInput?: boolean }) => void,
  },
  plugin: {
    // 在插件内调用
    exitCommand: () => void,
    getPreferenceValues: ((pluginName: string, commandName?: string) => Record<string, any>),
    openPreferences: (pluginName?: string, commandName?: string) => void,
    getLaunchData?: () => Promise<ICommandMatchData>
  }
  keyboard: {
    type: (...keys: string[]) => Promise<void>,
    holdKey: (...keys: string[]) => Promise<void>,
    releaseKey: (...keys: string[]) => Promise<void>,
  },
  mouse: {
    getPosition: () => Promise<{ x: number, y: number }>,
    setPosition: (point: {x: number, y: number}) => Promise<void>,
    move: (point: {x: number, y: number}) => Promise<void>,
    click: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => Promise<void>,
    doubleClick: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => Promise<void>,
    hold: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => Promise<void>,
    release: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => Promise<void>,
    drag: (point: {x: number, y: number}) => Promise<void>,
    scroll: (point: {x?: number, y?: number}) => Promise<void>
  },
  fetch: (...args: Parameters<typeof fetch>) => Promise<Response>,
  createView: (pluginName: string, options?: IWebviewTagAttributes) => Promise<{ webview: IWebview, bridge: IBridge }>,
  sendToHost: (channel: string, ...args: any[]) => void,
  onHostMessage: (channel: string, callback: (...args: any[]) => void) => void,
  offHostMessage: (channel: string, callback: (...args: any[]) => void) => void,

  utils: {
    debounce: <F extends ((...args: any[]) => any)>(fn: F, delay?: number) => (...args: Parameters<F>) => void,
    getFrontmostApplication: () => Promise<Application | undefined | null>,
    getSelectedPath: ({ fallbackCurrent }?: { fallbackCurrent?: boolean | undefined }) => Promise<string[]>,
    getCurrentPath: () => Promise<string | undefined | null>,
    hanziToPinyin: (hanzi: string) => string,
  },

  shortcuts: {
    register: (shortcuts: string, callback: () => void) => Promise<void>,
    unregister: (shortcuts: string, callback: () => void) => Promise<void>
  }

  showToast(options: {
    title?: string;
    icon?: "success" | "error" | "loading" | "none";
    image?: string;
    duration?: number;
  }): void

  showHUD(title: string, options?: { duration: number }): void,

  storage: {
    getItem: <T extends any>(key: string) => Promise<T | null>,
    setItem: (key: string, value: any) => Promise<PouchDB.Core.Response>,
    removeItem: (key: string) => Promise<void>,
  },

  runAppleScript: (script: string) => Promise<string>,
  runBashCommand: (command: string) => Promise<string>,
}

export interface IPluginManager {
  getPlugins: (options?: { includeDisabledPlugins?: boolean, includeDisabledCommand?: boolean }) => Map<string, IRunningPlugin>,
  getPlugin: (name: string) => IRunningPlugin | undefined
  unregisterPlugin: (name: string) => void,
  registerPlugin: (path: string) => void,

  disablePlugin: (name: string, disabled: boolean) => void,
  disablePluginCommand: (name: string, commandName: string, disabled: boolean) => void,

  updatePluginsSettings: (value: IPluginsSettings) => void
  updatePluginSettings: (name: string, settings: IPluginSettings) => void
  updatePluginPreferences: (name: string, prfs: Record<string, any>) => void
  updateCommandPreferences: (pluginName: string, commandName: string, prfs: Record<string, any>) => void
  updateCommandSettings: (pluginName: string, commandName: string, settings: ICommandSettings) => void

  handleQuery: (keyword: string) => Promise<IPluginCommand[]>,
  handleEnter: (command: IPluginCommand) => void,
  handleAction: (command: IPluginCommand, action: IActionItem, keyword: string) => void,
  handleSelect: (command: IPluginCommand, keyword: string) => string | HTMLElement | Promise<string | HTMLElement | undefined> | undefined,

  enterPluginCommand: (owner: IRunningPlugin, command: IPluginCommand, matchData: ICommandMatchData) => void
}

export interface ISettings {
  launchAtLogin: boolean,
  shortcuts: string,
  clearTimeout: 90,
  pluginsPathList: { path: string }[],
  pluginsSettings: IPluginsSettings,
}

declare global {
  interface Window {
    pluginManager?: IPluginManager

    publicApp: IPublicApp

    publicAppCommand?: IPluginCommandListView
  }

  interface WindowEventMap {
    'publicApp.shortcuts': CustomEvent<{ shortcuts: string }>,
  }
}