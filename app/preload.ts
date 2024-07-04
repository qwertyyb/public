import * as path from 'path'
import createAPI, { type IPublicApp } from './preload/preload.api'
import pluginManager, { type IPluginManager } from './preload/preload.plugin-manager'
import { getConfig } from './config'

const config = getConfig()

declare global {
  interface Window {
    publicApp?: IPublicApp
    pluginManager?: IPluginManager
  }
}

window.publicApp = createAPI()
window.pluginManager = pluginManager

const basicPlugin = path.join(config.pluginBasePath, './settings')
pluginManager.addPlugin(basicPlugin)

