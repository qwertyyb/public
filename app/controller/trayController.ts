import {
  Tray as ElectronTray,
  Menu as ElectronMenu,
  nativeImage as ElectronNativeImage,
} from 'electron'
import { CoreApp } from 'index';

let publicTray: ElectronTray | undefined


module.exports = (publicApp: CoreApp) => ({
  getTray() {
    return publicTray;
  },
  createTray() {
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
          publicApp.window.main?.show()
          publicApp.electronApp.focus({
            steal: true
          })
        }
      },
      { label: '关于Public', role: 'about' },
      {
        label: '退出Public',
        accelerator: 'Command+Q',
        click: () => { publicApp.electronApp.exit() }
      }
    ])
    publicTray?.setToolTip('Public')
    publicTray?.setContextMenu(contextMenu)
  }
})