import api, { type IPlugin } from '@public/api'
import { initSettings } from './lib/handler'

const createSettingsPlugin: IPlugin = (utils) => {

  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item, matchData) => {
      api.mainWindow.pushView({
        path: "/settings",
        params: { query: matchData.query },
      });
    }
  }
}

export default createSettingsPlugin
