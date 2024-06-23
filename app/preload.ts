import { ipcRenderer } from 'electron'
import * as path from 'path'
import createAPI from './preload/preload.api'
import * as PluginManager from './preload/preload.plugin-manager'
import { getConfig } from './config'

const config = getConfig()

window.publicApp = createAPI()
window.PluginManager = PluginManager

window.addEventListener('contextmenu', () => {
  ipcRenderer.invoke('contextmenu')
})

const basicPlugin = path.join(config.pluginBasePath, './settings')
console.log(basicPlugin)
PluginManager.addPlugin(basicPlugin)

