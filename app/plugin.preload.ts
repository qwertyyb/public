import { ipcRenderer } from 'electron'

console.log('hhh', localStorage.getItem('hello'))

const pluginPaths = [
  '../../plugins/packages/launcher',
  '../../plugins/packages/lockscreen',
  '../../plugins/packages/calculator',
]
const plugins = pluginPaths.map(path => require(path).default);

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

window.ipcRenderer = ipcRenderer