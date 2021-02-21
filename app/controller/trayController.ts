import {
  Tray as ElectronTray,
  Menu as ElectronMenu,
  nativeImage as ElectronNativeImage,
} from 'electron'
import { PublicApp } from 'global';

let publicTray: ElectronTray | undefined


module.exports = (publicApp: PublicApp) => ({
  getTray() {
    return publicTray;
  },
  createTray() {
    if (publicTray) return publicTray
    const path = require('path')
    const { nativeImage, Menu , Tray } : typeof Electron = require('electron')
    const image = nativeImage.createFromPath(path.join(__dirname, '../assets/status/status.png'))
    publicTray = new Tray(image)
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示',
        click: () => {
          publicApp.window.main?.show()
          publicApp.electronApp.focus({
            steal: true
          })
        }
      },
      { label: '关于', role: 'about' },
      { label: '退出', role: 'quit' }
    ])
    publicTray?.setToolTip('Public Tools')
    publicTray?.setContextMenu(contextMenu)
  }
})