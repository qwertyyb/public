import { BrowserWindow, ipcRenderer, remote } from 'electron'
import { PublicApp } from 'global';

const defaultPlugins = [
  '../../plugins/packages/settings',
  '../../plugins/packages/launcher',
  '../../plugins/packages/lockscreen',
  '../../plugins/packages/calculator',
]

const customPlugins: string[] = [];

interface InitPluginParams {
  getApp: () => PublicApp,
  getMainWindow: () => BrowserWindow,
  getPlugins: () => PublicPlugin[],
}

const initPlugin = (pluginPath: string): PublicPlugin | undefined => {
  try {
    const createPlugin = require(pluginPath).default
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

const pluginPaths: string[] = [...defaultPlugins, ...customPlugins]
let plugins: PublicPlugin[]

const initPlugins = (pluginPaths: string[]) => {
  plugins = pluginPaths.map(path => initPlugin(path)).filter(p => p) as PublicPlugin[];
  return plugins
}

initPlugins(pluginPaths)

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
    console.log('aaaa')
    args.item.onEnter?.(args.item, args.index, args.list)
  }
}

ipcRenderer.on('getPlugins', (e, ...args) => {
  console.log(e, args)
  e.sender.sendTo(e.senderId, 'getPlugins:response', JSON.parse(JSON.stringify(plugins)))
})


window.ipcRenderer = ipcRenderer