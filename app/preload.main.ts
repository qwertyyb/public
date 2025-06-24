import { join as pathJoin } from 'path'
import createCommonAPI, { createDraggable } from './preload/preload.common'
import { registerPlugin, unregisterPlugin, disablePlugin, disablePluginCommand, updatePluginsSettings, getPlugins, updatePluginPreferences, updateCommandPreferences, getPlugin, updatePluginSettings, updateCommandSettings  } from "./preload/plugin/manager"
import { handleQuery, handleSelect, handleEnter, handleAction, enterPluginCommand } from "./preload/plugin/service"
import { getConfig } from './config'

const config = getConfig()

createDraggable()

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
  updatePluginSettings,
  updateCommandSettings,

  handleQuery,
  handleSelect,
  handleEnter,
  handleAction,

  enterPluginCommand,
}

const basicPlugin = pathJoin(config.pluginBasePath, './settings')
window.pluginManager!.registerPlugin(basicPlugin)
