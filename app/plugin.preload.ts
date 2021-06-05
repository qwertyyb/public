import { ipcRenderer, contextBridge } from 'electron'
// @ts-ignore
import * as remote from '@electron/remote'
import { CoreApp } from 'index';
import * as path from 'path';
import { PublicPlugin, CommonListItem } from 'shared/types/plugin';

const publicApp = {
  db: {
    run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
    all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
    get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
  },
  getMainWindow: () => remote.getGlobal('coreApp').mainWindow,
}


const getPluginsPath = (): string[] => {
  const defaultPlugins: string[] = [
    path.resolve(__dirname, '../plugins/settings/main.js'),
    path.resolve(__dirname, '../plugins/launcher/index.js'),
    path.resolve(__dirname, '../plugins/command/index'),
    path.resolve(__dirname, '../plugins/calculator'),
    path.resolve(__dirname, '../plugins/qrcode'),
    path.resolve(__dirname, '../plugins/search/index'),
    path.resolve(__dirname, '../plugins/translate/index'),
    path.resolve(__dirname, '../plugins/clipboard/index'),
    path.resolve(__dirname, '../plugins/terminal/index')
  ]
  
  const customPlugins: string[] = [];
  return [...defaultPlugins, ...customPlugins]
}

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
    return plugin
  } catch (err) {
    console.log(`引入插件 ${pluginPath} 失败`)
    console.error(err)
  }
}
let plugins: PublicPlugin[]

const initPlugins = () => {
  plugins = getPluginsPath().map(path => registerPlugin(path)).filter(p => p) as PublicPlugin[];
  return plugins
}

initPlugins()

// @ts-ignore
window.requestIdleCallback(() => {
  (remote.getGlobal('coreApp') as CoreApp).mainWindow?.on('show', () => {
    document.dispatchEvent(new CustomEvent('mainwindowshow'))
  })
})

ipcRenderer.on('getPlugins', (e, ...args) => {
  e.sender.sendTo(e.senderId, 'getPlugins:response', JSON.parse(JSON.stringify(plugins)))
})

ipcRenderer.on('removePlugin', (e, { index }) => {
  plugins.splice(index, 1);
  e.sender.sendTo(e.senderId, 'removePlugin:response', { index })
})

ipcRenderer.on('registerPlugin', (e, { path }) => {
  const paths = getPluginsPath()
  if (paths.some(s => s.includes(path))) {
    return e.sender.sendTo(e.senderId, 'registerPlugin:error', '该插件已注册')
  }
  const plugin = registerPlugin(path)
  plugins.push(plugin as PublicPlugin)
  e.sender.sendTo(e.senderId, 'registerPlugin:response', JSON.parse(JSON.stringify(plugin)))
})


window.ipcRenderer = ipcRenderer
window.publicApp = publicApp
window.PluginManager = {
  getPlugins() {
    return plugins
  },
  handleQuery(
    keyword: string
  ) {
    console.log('aaaa')
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
    if (typeof args.item.onEnter === 'function') {
      args.item.onEnter?.(args.item, args.index, args.list)
    } else if (typeof plugin.onEnter === 'function') {
      plugin.onEnter?.(args.item, args.index, args.list)
    }
  },
}