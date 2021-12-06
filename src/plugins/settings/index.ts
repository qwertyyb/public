const path = require('path')

const refreshSettings = async () =>  {
  globalThis.publicApp.storage.getItem('config').then(settingsStr => {
    const settings = settingsStr && JSON.parse(settingsStr) || {}
    globalThis.publicApp.enableLaunchAtLogin(settings.launchAtLogin)
    globalThis.publicApp.registerShortcuts(settings)
    console.log(settings, path.resolve(__dirname, '../search-mdn/plugin.json'))
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../search-mdn/plugin.json')
    )
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../calculator/plugin.json')
    )
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../command/plugin.json')
    )
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../search/plugin.json')
    )
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../clipboard/plugin.json')
    )
    globalThis.publicApp.pluginManager.register(
      path.resolve(__dirname, '../launcher/plugin.json')
    )
    // settings.plugins.forEach(({ path }) => {
    //   // globalThis.publicApp.pluginManager.register(path)
    // })
  })
}

refreshSettings()

const SettingsPlugin = {
  onEnter: () => {
    globalThis.publicApp.enterPlugin()
  }
}

module.exports = SettingsPlugin