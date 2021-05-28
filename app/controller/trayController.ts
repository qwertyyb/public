import {
  Tray as ElectronTray,
} from 'electron'
import { CoreApp } from 'index'

let publicTray: ElectronTray | undefined


const createTray = (coreApp: CoreApp) => {
  if (publicTray) return publicTray
  const path = require('path')
  const { nativeImage, Menu , Tray } : typeof Electron = require('electron')
  console.log(path.join(__dirname, '../../assets/status/status.png'))
  const image = nativeImage.createFromPath(path.join(__dirname, '../../assets/status/statusTemplate.png'))
  publicTray = new Tray(image)
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
      role: 'quit'
    }
  ])
  publicTray?.setToolTip('Public')
  publicTray?.setContextMenu(contextMenu)
}

export default (coreApp: CoreApp) => {
  createTray(coreApp);
  return {
    getTray() {
      return publicTray;
    },
  }
}