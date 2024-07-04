import * as path from 'path'

import { initSettings, initHandler } from './handler'

const settingsPlugin: IPlugin = (utils) => {

  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item) => {
      const bridge = await utils.enter(item, {
        entry: path.join(__dirname, '../public/settings.html'),
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false,
          allowRunningInsecureContent: false,
          spellcheck: false,
          devTools: true,
          contextIsolation: false,
          backgroundThrottling: false,
          enablePreferredSizeMode: true,
          sandbox: false,
        }
      })
      initHandler(bridge)
    }
  }
}

export default settingsPlugin
