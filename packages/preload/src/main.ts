import { join as pathJoin } from 'path'
import createCommonAPI, { createDraggable } from './lib/common'
import { registerPlugin, unregisterPlugin, disablePlugin, disablePluginCommand, updatePluginsSettings, getPlugins, updatePluginPreferences, updateCommandPreferences, getPlugin, updatePluginSettings, updateCommandSettings, launchPlugins  } from "./lib/manager"
import { handleQuery, handleSelect, handleEnter, handleAction, enterPluginCommand } from "./lib/service"


createDraggable()

window.publicApp = createCommonAPI({ runtime: 'main' })
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
