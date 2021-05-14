import { CommonListItem, PublicApp, PublicPlugin } from "../../shared/types/plugin";
import { ipcRenderer } from 'electron'

const KEYWORDS = [
  'public settings',
  '设置'
]

const getLocalSettings = () => {
  const val = localStorage.getItem('settings')
  return val && JSON.parse(val) || {
    autoLaunch: true,
    shortcut: 'CommandOrControl+Space',
    shortcuts: [
      { keyword: 'cp ', shortcut: 'Command+Shift+V' }
    ]
  }
}

const updateSettings = (settings: any) => {
  localStorage.setItem('settings', JSON.stringify(settings))
}

const registerShortcut = (app: PublicApp) => {
  const { shortcut, shortcuts } = getLocalSettings();
  const list = [
    { shortcut, keyword: '' },
    ...shortcuts
  ]
  const remote = require('@electron/remote')
  const globalShortcut = remote.globalShortcut
  globalShortcut.unregisterAll()
  list.forEach(({ keyword, shortcut, temp }) => {
    shortcut && !temp && globalShortcut.register(shortcut, () => {
      app.getMainWindow().show()
      // @ts-ignore
      keyword && window.setQuery && window.setQuery(keyword)
    })
  })
}

let win: any = null;

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    registerShortcut(app)
  })

  // @ts-ignore 注册开机启动
  window.requestIdleCallback(() => {
    require('@electron/remote').app.setLoginItemSettings({
      openAtLogin: getLocalSettings().autoLaunch
    })
  })

  ipcRenderer.on('plugin:settings:registerShortcut', (e: any, arg: any) => {
    updateSettings(arg.settings);
    registerShortcut(app);
  })
  ipcRenderer.on('plugin:settings:openAtLogin', (e: any, arg: any) => {
    updateSettings(arg.settings);
    require('@electron/remote').app.setLoginItemSettings({
      openAtLogin: getLocalSettings().autoLaunch
    })
  })
  return {
    title: '设置',
    icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
    subtitle: 'Public设置',
    onInput(
      keyword: string
    ) {
      keyword = keyword.toLocaleLowerCase()
      if (app.getUtils().match(KEYWORDS, keyword)) {
        app.setList([
          {
            title: '设置',
            subtitle: 'Public设置',
            icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
            key: 'public:settings',
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
              win.webContents.loadFile(path.join(__dirname, './index.html'))
              win.webContents.openDevTools()
              win.on('close', () => {
                win = null
              })
              win.on('ready-to-show', () => {
                win.show()
              })
            }
          }
        ])
      } else {
        app.setList([])
      }
    }
  }
}