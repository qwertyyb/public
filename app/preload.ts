import { ipcRenderer } from 'electron'
import * as path from 'path'
import createAPI from './preload/preload.api'
import * as PluginManager from './preload/preload.plugin-manager'

window.publicApp = createAPI()
window.PluginManager = PluginManager

window.addEventListener('contextmenu', () => {
  ipcRenderer.invoke('contextmenu')
})

const basicPlugin = path.join(__dirname, '../../plugins/settings')
console.log(basicPlugin)
PluginManager.addPlugin(basicPlugin)

