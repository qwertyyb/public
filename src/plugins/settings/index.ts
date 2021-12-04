const path = require('path')
import { PublicApp, PublicPlugin } from "../../shared/types/plugin"

const KEYWORDS = [
  'public settings',
  '设置'
]

const refreshSettings = async () =>  {
  globalThis.publicApp.storage.getItem('config').then(settingsStr => {
    const settings = settingsStr && JSON.parse(settingsStr) || {}
    globalThis.publicApp.enableLaunchAtLogin(settings.launchAtLogin)
    globalThis.publicApp.registerShortcuts(settings)
    console.log(settings)
    settings.plugins.forEach(({ path }) => {
      globalThis.publicApp.pluginManager.register(path)
    })
  })
}

refreshSettings()

const SettingsPlugin = {
  title: '设置',
  icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
  subtitle: 'Public设置',

  main: './public/index.html',
  onInput(
    keyword: string
  ) {
    keyword = keyword.toLocaleLowerCase()
    if (!globalThis.publicApp.getUtils().match(KEYWORDS, keyword)) {
      return globalThis.publicApp.setList([])
    }
    globalThis.publicApp.setList([
      {
        title: '设置',
        subtitle: 'Public设置',
        icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
        key: 'public:settings'
      }
    ])
  },
  onEnter: () => {
    console.log('ssssss')
    globalThis.publicApp.enterPlugin()
  }
}

module.exports = SettingsPlugin