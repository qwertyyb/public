import { join as pathJoin } from 'path'
import createCommonAPI from './preload/preload.common'
import { registerPlugin, unregisterPlugin, disablePlugin, disablePluginCommand, updatePluginsSettings, getPlugins, updatePluginPreferences, updateCommandPreferences, getPlugin  } from "./preload/plugin/manager"
import { handleQuery, handleSelect, handleEnter, handleAction, enterPluginCommand } from "./preload/plugin/service"
import { getConfig } from './config'

const config = getConfig()

window.publicApp = createCommonAPI()
window.pluginManager = {
  registerPlugin,
  unregisterPlugin,
  disablePlugin,
  disablePluginCommand,
  updatePluginsSettings,
  getPlugins,
  getPlugin,

  updatePluginPreferences,
  updateCommandPreferences,

  handleQuery,
  handleSelect,
  handleEnter,
  handleAction,

  enterPluginCommand,
}

const basicPlugin = pathJoin(config.pluginBasePath, './settings')
window.pluginManager!.registerPlugin(basicPlugin)

