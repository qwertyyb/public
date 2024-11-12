import * as path from 'path'
import createAPI from './preload/preload.api'
import pluginManager from './preload/preload.plugin-manager'
import { getConfig } from './config'

const config = getConfig()

window.publicApp = createAPI()
window.pluginManager = pluginManager

const basicPlugin = path.join(config.pluginBasePath, './settings')
pluginManager.addPlugin(basicPlugin)

