import { app, Tray, nativeImage, Menu } from 'electron'
import { CoreApp } from '../index'

const createTray = (coreApp: CoreApp) => {
  const path = require('path')
  console.log(path.join(__dirname, '../../assets/status/status.png'))
  const image = nativeImage.createFromPath(path.join(__dirname, '../../../assets/status/statusTemplate.png'))
  const publicTray = new Tray(image)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => {
        coreApp.mainWindow?.show()
        coreApp.electronApp.focus({
          steal: true
        })
      }
    },
    {
      label: '检查更新...',
      click: () => coreApp.updater.checkForUpdatesAndNotify()
    },
    { label: '关于Public', role: 'about' },
    {
      label: '退出Public',
      accelerator: 'Command+Q',
      click() {
        app.exit(0)
      }
    },
    { type: 'separator' },
    {
      label: '切换开发者工具',
      click: () => {
        const webContents = coreApp.mainView.webContents
        const isOpened = webContents?.isDevToolsOpened()
        console.log('devtools opened', isOpened)
        if (isOpened) {
          return webContents?.closeDevTools()
        }
        webContents?.openDevTools({ mode: 'undocked' })
      }
    },
  ])
  publicTray?.setToolTip('Public')
  publicTray?.setContextMenu(contextMenu)
  return publicTray
}

export default (coreApp: CoreApp) => {
  return createTray(coreApp);
}