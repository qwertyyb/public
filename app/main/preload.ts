import { app, ipcRenderer } from 'electron'
import launcherPlugin from '../plugins/launcher'
import lockscreen from '../plugins/lockscreen'
import calculator from '../plugins/calculator/index'

const plugins = [
  lockscreen,
  launcherPlugin,
  calculator
]

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