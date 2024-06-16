import { PublicApp, PublicPlugin } from "../../shared/types/plugin";

import { initSettings, initHandler, setTargetWin } from './handler'

const KEYWORDS = [
  'public settings',
  '设置'
]

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    initSettings()
  })

  initHandler()

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
    onEnter: () => {
      const path = require('path')
      const win = window.open('file://' + path.join(__dirname, './settings.html'), 'settings', 'nodeIntegration=yes,contextIsolation=no')
      setTargetWin(win)
    }
  }
}