import { IActionItem, IPluginCommand, IRunningPlugin } from './plugin'
import { PortBridge } from './utils'

export * from './plugin'
export * from './utils'

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
  },
  inputBar: {
    setValue: (value: string) => void,
  },
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
  enter: (name: string, item: IPluginCommand, args: any, query?: string) => Promise<PortBridge>,
  exit: (options?: { clearMainInputValue: true }) => Promise<void>,

  utils: {
    debounce: <F extends (...args: any[]) => any>(fn: F, delay = 200) => (...args: Parameters<F>) => void,
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
}

export interface IPluginManager {
  getPlugins: (options?: { includeDisabledPlugins?: boolean, includeDisabledCommand?: boolean }) => Map<string, IRunningPlugin>,
  unregisterPlugin: (name: string) => void,
  registerPlugin: (path: string) => void,

  disablePlugin: (name: string, disabled: boolean) => void,
  disablePluginCommand: (name: string, commandName: string, disabled: boolean) => void,

  updatePluginsSettings: (value: IPluginsSettings) => void

  handleQuery: (keyword: string) => Promise<IPluginCommand[]>,
  handleEnter: (command: IPluginCommand) => void,
  handleAction: (command: IPluginCommand, action: IActionItem, keyword: string) => void,
  handleSelect: (command: IPluginCommand, keyword: string) => string | HTMLElement | Promise<string | HTMLElement | undefined> | undefined,

  enterPluginCommand: (owner: IRunningPlugin, command: IPluginCommand, options?: {
    query: string;
  }) => void
}

declare global {
  interface Window {
    pluginManager?: IPluginManager

    publicApp: IPublicApp
  }

  interface WindowEventMap {
    'publicApp.shortcuts': CustomEvent<{ shortcuts: string }>,
  }
}
