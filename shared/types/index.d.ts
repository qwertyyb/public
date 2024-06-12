import { BrowserWindow, Common, webContents } from "electron"
import { PublicPlugin } from './plugin'

declare global {
  var ResizeObserver: any
  var PluginManager: {
    getPlugins: () => PublicPlugin[],
    removePlugin: (index: number) => void,
    registerPlugin: ({ path }: { path: string }) => void,

    handleQuery: (keyword: string) => void,
    handleEnter: (
      plugin: PublicPlugin,
      args: {
        item: CommonListItem,
        index: number,
        list: CommonListItem[]
      }
    ) => void,
  }


  var publicApp: {
    db: {
      run: (sql, params?) => Promise<any>,
      all: (sql, params?) => Promise<Array>,
      get: (sql, params?) => Promise<Any>
    },
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
    }
  }
}
