import { ipcRenderer } from 'electron'
// @ts-ignore
import * as remote from '@electron/remote'
import { CoreApp } from 'index';
import * as path from 'path';
import { PublicPlugin, CommonListItem } from 'shared/types/plugin';

const getPluginsPath = (): string[] => {
  const defaultPlugins: string[] = [
    path.resolve(__dirname, '../plugins/settings/main.js'),
    path.resolve(__dirname, '../plugins/launcher/index.js'),
    path.resolve(__dirname, '../plugins/command/index'),
    path.resolve(__dirname, '../plugins/calculator'),
    path.resolve(__dirname, '../plugins/qrcode'),
    path.resolve(__dirname, '../plugins/search/index'),
    path.resolve(__dirname, '../plugins/translate/index'),
    path.resolve(__dirname, '../plugins/terminal/index')
  ]
  
  const customPlugins: string[] = [];
  return [...defaultPlugins, ...customPlugins]
}

const registerPlugin = (pluginPath: string): PublicPlugin | undefined => {
  try {
    const createPlugin = require(pluginPath).default || require(pluginPath)
    const plugin = createPlugin({
      getApp: () => remote.getGlobal('publicApp'),
      getMainWindow: () => remote.getGlobal('publicApp').window.main,
      getPlugins: () => plugins,
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
  (remote.getGlobal('publicApp') as CoreApp).window.main?.on('show', () => {
    document.dispatchEvent(new CustomEvent('mainwindowshow'))
  })
})

window.PluginManager = {
  getPlugins() {
    return plugins
  },
  handleInput(
    keyword: string,
    setResult: (plugin: PublicPlugin, list: CommonListItem[]) => void
  ) {
    const setPluginResult = (plugin: PublicPlugin) => (list: CommonListItem[]) => setResult(plugin, list)
    plugins.forEach(plugin => plugin.onInput?.(keyword, setPluginResult(plugin)))
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