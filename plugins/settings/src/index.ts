import { IPlugin } from '@public/shared'
import { initSettings, initHandler } from './handler'

const settingsPlugin: IPlugin = (utils) => {

  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item) => {
      const url = new URL(location.href)
      url.hash = '#/settings'
      const bridge = await utils.enter(item, {
        entry: url.href,
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
