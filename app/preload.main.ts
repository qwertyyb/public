import { join as pathJoin } from 'path'
import createCommonAPI from './preload/preload.common'
import pluginManager from './preload/preload.plugin-manager'
import { getConfig } from './config'

const config = getConfig()

window.publicApp = createCommonAPI()
window.pluginManager = pluginManager

const basicPlugin = pathJoin(config.pluginBasePath, './settings')
pluginManager.addPlugin(basicPlugin)

