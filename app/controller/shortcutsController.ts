import { PublicApp } from "global"

module.exports = (publicApp: PublicApp) => {
  const { globalShortcut } = require('electron')
  return {
    register() {
      globalShortcut.register('CommandOrControl+Space', () => {
        publicApp.window.main?.show()
        publicApp.electronApp.focus({
          steal: true
        })
      })
    },
    unregisterAll() {
      globalShortcut.unregisterAll()
    }
  }
}