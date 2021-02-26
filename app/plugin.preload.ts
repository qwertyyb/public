import { BrowserWindow, ipcRenderer, remote } from 'electron'
import { PublicApp } from 'global';
import * as path from 'path';

const getPluginsPath = (): string[] => {
  const defaultPlugins = [
    path.resolve(__dirname, '../plugins/settings/main.js'),
    path.resolve(__dirname, '../plugins/launcher/index.js'),
    path.resolve(__dirname, '../plugins/lockscreen'),
    path.resolve(__dirname, '../plugins/calculator'),
  ]
  
  const customPlugins: string[] = [];
  return [...defaultPlugins, ...customPlugins]
}

const registerPlugin = (pluginPath: string): PublicPlugin | undefined => {
  try {
    const createPlugin = require(pluginPath).default || require(pluginPath)
    return createPlugin({
      getApp: () => remote.getGlobal('publicApp'),
      getMainWindow: () => remote.getGlobal('publicApp').window.main,
      getPlugins: () => plugins,
      getUtils: () => require('./utils/index')
    })
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

window.service = {
  getPlugins () {
    return plugins
  }
}
window.PluginManager = {
  getPlugins() {
    return plugins
  },
  handleInput(
    keyword: string,
    setResult: (plugin: PublicPlugin, list: CommonListItem[]) => void
  ) {
    const setPluginResult = (plugin: PublicPlugin) => (list: CommonListItem[]) => setResult(plugin, list)
    plugins.forEach(plugin => plugin.onInput(keyword, setPluginResult(plugin)))
  },
  handleEnter(
    plugin: PublicPlugin,
    args: {
      item: CommonListItem,
      index: number,
      list: CommonListItem[]
    }
  ) {
    args.item.onEnter?.(args.item, args.index, args.list)
  }
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