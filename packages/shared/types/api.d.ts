import { ICommandMatchData } from "./plugin"

export interface IPublicAppBaseAPI {
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
    pathJoin: typeof path.join
  },

  clipboard: {
    readText: () => string
    readHTML: () => string
    paste: (content?: string | { html: string }) => Promise<void>
  }

  shortcuts: {
    register: (shortcuts: string, callback: () => void) => Promise<void>,
    unregister: (shortcuts: string) => Promise<void>
  }

  showToast(options: {
    title?: string;
    icon?: "success" | "error" | "loading" | "none";
    image?: string;
    duration?: number;
  }): void

  showHUD(title: string, options?: { duration: number }): void,

  storage: {
    getItem: <T extends any>(key: string) => Promise<T | undefined>,
    setItem: (key: string, value: any) => Promise<PouchDB.Core.Response>,
    removeItem: (key: string) => Promise<void>,
  },

  runAppleScript: (script: string) => Promise<string>,
  runBashCommand: (command: string) => Promise<string>,
}

export interface IPublicAppMainAPI extends IPublicAppBaseAPI {
  plugin: {
    getPreferenceValues: (
      pluginName: string,
      commandName?: string
    ) => Record<string, any>;
    openPreferences: (pluginName: string, commandName?: string) => void;
    enterCommand: (pluginName: string, commandName: string, matchData: ICommandMatchData) => void;
  };
}

export interface IPublicAppPluginAPI extends IPublicAppBaseAPI {
  plugin: {
    getPreferenceValues: ((commandName?: string) => Record<string, any>),
    openPreferences: (commandName?: string) => void,
    enterCommand: (commandName: string, pluginName: string, matchData: ICommandMatchData) => void,
    enterCommand: (commandName: string, matchData: ICommandMatchData) => void,
  }
}