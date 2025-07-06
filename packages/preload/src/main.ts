import { join as pathJoin } from 'path'
import { createMainAPI, createPluginAPI } from './lib/api'
import { createDraggable } from './lib/draggable'
import { registerPlugin, unregisterPlugin, disablePlugin, disablePluginCommand, updatePluginsSettings, getPlugins, updatePluginPreferences, updateCommandPreferences, getPlugin, updatePluginSettings, updateCommandSettings, launchPlugins, getPluginPreferences, getCommandPreferences } from "./lib/manager"
import { handleQuery, handleSelect, handleEnter, handleAction, enterPluginCommand } from "./lib/service"

createDraggable()

window.PublicApp = {
  mainAPI: createMainAPI(),
  createPluginAPI,
}

window.publicApp = window.PublicApp.mainAPI
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

  getPluginPreferences,
  updatePluginSettings,

  getCommandPreferences,
  updateCommandSettings,

  handleQuery,
  handleSelect,
  handleEnter,
  handleAction,

  enterPluginCommand,
}

launchPlugins()

// const basicPlugin = pathJoin(config.pluginBasePath, './settings')
// window.pluginManager!.registerPlugin(basicPlugin)

window.CSS.registerProperty({
  name: '--nav-height',
  syntax: '<length>',
  inherits: true,
  initialValue: '48px'
})

window.CSS.registerProperty({
  name: '--nav-width',
  syntax: '<length>',
  inherits: true,
  initialValue: '36px'
})
