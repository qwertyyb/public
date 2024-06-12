import { ipcRenderer } from 'electron'
import * as remote from '@electron/remote'
import * as path from 'path';
import { PublicPlugin, CommonListItem } from 'shared/types/plugin';

const publicApp = {
  db: {
    run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
    all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
    get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
  },
  mainWindow: {
    show: () => ipcRenderer.invoke('mainWindow.show'),
    hide: () => ipcRenderer.invoke('mainWindow.hide'),
  },
  inputBar: {
    setValue: (value: string) => { window.dispatchEvent(new CustomEvent('inputBar.setValue', { detail: { value } })) }
  },
  keyboard: {
    type: (...keys: string[]) => ipcRenderer.invoke('keyboard.type', ...keys),
    holdKey: (...keys: string[]) => ipcRenderer.invoke('keyboard.holdkey', ...keys),
    releaseKey: (...keys: string[]) => ipcRenderer.invoke('keyboard.releaseKey', ...keys),
  },
  mouse: {
    getPosition: () => ipcRenderer.invoke('mouse.getPosition'),
    setPosition: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.setPosition', point),
    move: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.move', point),
    click: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.click', button),
    doubleClick: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.doubleClick', button),
    hold: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.hold', button),
    release: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.release', button),
    drag: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.drag', point),
    scroll: (point: {x?: number, y?: number}) => ipcRenderer.invoke('mouse.scroll', point),
  }
}

window.publicApp = publicApp

const plugins: PublicPlugin[] = []
const registerPlugin = (pluginPath: string): PublicPlugin | undefined => {
  try {
    const createPlugin = require(pluginPath).default || require(pluginPath)
    const plugin = createPlugin({
      getApp: () => remote.getGlobal('coreApp'),
      getMainWindow: () => remote.getGlobal('coreApp').mainWindow,
      db: {
        run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
        all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
        get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
      },
      getUtils: () => require('./utils/index'),
      setList: (list: CommonListItem[]) => {
        const event = new CustomEvent('plugin:setList', {
          detail: {
            plugin,
            list,
          }
        })
        document.dispatchEvent(event)
      },
    })
    plugin.path = pluginPath
    plugins.push(plugin as PublicPlugin)
    return plugin
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

const getBasicPath = (): string[] => {
  return [
    require.resolve(path.resolve(__dirname, '../plugins/settings/main.js')),
  ]
}

const checkPluginsRegistered = (path: string) => {
  const resolvedPaths = plugins.map((p: any) => require.resolve(p.path))
  const targetPath = require.resolve(path);
  return resolvedPaths?.includes(targetPath)
}


window.onload = () => {
  getBasicPath().map(path => registerPlugin(path))
}

window.PluginManager = {
  getPlugins() {
    return plugins
  },
  removePlugin(index: number) {
    plugins.splice(index, 1);
  },
  registerPlugin({ path }: { path: string }) {
    if (checkPluginsRegistered(path)) {
      throw new Error('插件已注册,请勿重复注册: ' + path)
    }
    const plugin = registerPlugin(path)
    return plugin
  },

  handleQuery(
    keyword: string
  ) {
    console.log('keyword', keyword)
    plugins.forEach(plugin => plugin.onInput?.(keyword))
  },
  handleEnter(
    plugin: PublicPlugin,
    args: {
      item: CommonListItem,
      index: number,
      list: CommonListItem[]
    }
  ) {
    console.log(args.item)
    if (typeof args.item.onEnter === 'function') {
      args.item.onEnter?.(args.item, args.index, args.list)
    } else if (typeof plugin.onEnter === 'function') {
      plugin.onEnter?.(args.item, args.index, args.list)
    }
  },
}
