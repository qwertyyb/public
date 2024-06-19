import { PublicApp, PublicPlugin } from "../../shared/types/plugin";

import { initSettings, initHandler } from './handler'

const KEYWORDS = [
  'public settings',
  '设置'
]

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onInput(
      keyword: string
    ) {
      keyword = keyword.toLocaleLowerCase()
      if (!app.getUtils().match(KEYWORDS, keyword)) {
        return app.setList([])
      }
      app.setList([
        {
          title: '设置',
          subtitle: 'Public设置',
          icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
          key: 'public:settings'
        }
      ])
    },
    onEnter: async (item) => {
      const path = require('path')
      const port = await app.enter(item, {
        entry: path.join(__dirname, './settings.html'),
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
      initHandler(port)
    }
  }
}