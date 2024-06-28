import * as path from 'path'
import type { PublicApp, PublicPlugin } from "../../../shared/types/plugin"

import { initSettings, initHandler } from './handler'

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item) => {
      const bridge = await app.enter(item, {
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
      console.log('bridge', bridge)
      initHandler(bridge)
    }
  }
}