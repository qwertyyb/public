import { ipcRenderer } from 'electron'

const defaultPlugins = [
  '../../plugins/packages/settings',
  '../../plugins/packages/launcher',
  '../../plugins/packages/lockscreen',
  '../../plugins/packages/calculator',
]

const customPlugins: string[] = [];

interface InitPluginParams {
  getElectron: () => typeof Electron,
  getPlugins: () => PublicPlugin[],
}

const initPlugin = (pluginPath: string): PublicPlugin | undefined => {
  try {
    const createPlugin = require(pluginPath).default
    return createPlugin({
      getElectron: () => require('electron'),
      getPlugins: () => plugins,
    })
  } catch (err) {
    console.log(`引入插件 ${pluginPath} 失败`)
    console.error(err)
  }
}

const pluginPaths: string[] = [...defaultPlugins, ...customPlugins]
const plugins: PublicPlugin[] = pluginPaths.map(path => initPlugin(path)).filter(p => p) as PublicPlugin[];

console.log(plugins)

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
  console.log(e, args)
  e.sender.sendTo(e.senderId, 'getPlugins:response', JSON.parse(JSON.stringify(plugins)))
})

window.ipcRenderer = ipcRenderer