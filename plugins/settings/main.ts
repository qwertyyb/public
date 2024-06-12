import { PublicApp, PublicPlugin } from "../../shared/types/plugin";

import { initSettings, initHandler } from './handler'

const KEYWORDS = [
  'public settings',
  '设置'
]

let win: any = null;

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    initSettings()
  })

  initHandler();


  return {
    title: '设置',
    icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
    subtitle: 'Public设置',
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
      if (win) {
        win?.show()
        return;
      }
      const path = require('path')
      const { BrowserWindow } = require('@electron/remote')
      win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          devTools: true,
          nodeIntegration: true,
          enableRemoteModule: true,
          contextIsolation: false,
        }
      })
      win.webContents.loadURL('file://' + path.join(__dirname, './index.html'))
      // win.webContents.openDevTools()
      win.on('close', () => {
        win = null
      })
      win.on('ready-to-show', () => {
        win.show()
      })
      console.log(win)
    }
  }
}