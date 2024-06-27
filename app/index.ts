import * as path from 'path';
import { getFileIcon } from '@public/osx-fileicon'
import { app, BaseWindow, protocol, WebContentsView, type Tray } from "electron";
import { autoUpdater } from "electron-updater"
import * as robotjs from '@nut-tree-fork/nut-js'
import initIpc from './ipc'
import initTray from './controller/trayController'
import db from './controller/storageController'
import { getConfig } from './config';
require('@electron/remote/main').initialize()

const config = getConfig()

app.setActivationPolicy('accessory')

export class CoreApp {
  readonly electronApp = app;
  readonly db = db;
  readonly robot = robotjs;
  tray: Tray;
  mainWindow?: BaseWindow;
  mainView?: WebContentsView;
  pluginView?: WebContentsView;
  readonly updater = autoUpdater;

  constructor() {
    this.electronApp.whenReady().then(() => {
      this.mainWindow = this.createMainWindow();
      
      this.electronApp.setAccessibilitySupportEnabled(true)
    
      this.updater.checkForUpdatesAndNotify();

      this.tray = initTray(this)

      protocol.handle('ipublic', async (request) => {
        const { host, pathname, searchParams } = new URL(request.url)
        if (request.method === 'GET' && host === 'public.qwertyyb.com' && pathname === '/file-icon') {
          const buffer = await getFileIcon(searchParams.get('path'), Number(searchParams.get('size')) || 100)
          return new Response(buffer, {
            headers: {
              'Content-Type': 'image/png'
            }
          })
        }
      })

      initIpc(this)
    })
    
    this.electronApp.on('window-all-closed', () => {
      this.electronApp.quit();
    });
  }

  private createMainWindow() {
    const win = new BaseWindow({
      height: 48 + 54 * 9,
      useContentSize: false,
      minWidth: 780,
      width: 780,
      y: 120,
      center: true,
      show: true,
      resizable: false,
      minimizable: false, 
      maximizable: false,
      frame: false,
      // vibrancy: 'under-window',
      hiddenInMissionControl: true,
      skipTaskbar: true,
      roundedCorners: true
    })
    const mainView = new WebContentsView({
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: true,
        preload: path.join(__dirname, './preload.js'),
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        sandbox: false,
        transparent: true
      }
    })
    this.mainView = mainView
    win.contentView.addChildView(mainView)
    mainView.setBounds({ x: 0, y: 0, width: 780, height: 600 })
    require("@electron/remote/main").enable(mainView.webContents)

    // mainView.webContents.on('preferred-size-changed', (() => {
    //   let timeout = null
    //   return (event, size) => {
    //     // timeout && clearTimeout(timeout)
    //     // if (this.pluginView) {
    //     //   win.setSize(780, 48 + 54 * 9)
    //     // } else {
    //     //   setTimeout(() => {
    //     //     mainView.setBounds({ ...mainView.getBounds(), height: size.height })
    //     //     win.setSize(780, size.height)
    //     //   }, 10)
    //     // }
    //   }
    // })())
    mainView.webContents.on('before-input-event', (event, inputEvent) => {
      const keys = {
        ArrowUp: 'Up',
        ArrowLeft: 'Left',
        ArrowRight: 'Right',
        ArrowDown: 'Down'
      }
      // @ts-ignore
      this.pluginView?.webContents.sendInputEvent({ type: inputEvent.type, keyCode: keys[inputEvent.key] || inputEvent.key })
    })
    win.on('hide', () => {
      mainView.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.hide'))`)
    })
    win.on('show', () => {
      mainView.webContents.focus()
      mainView.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.show'))`)
    })
    mainView.webContents.loadURL(config.rendererEntry)

    mainView.webContents.on('context-menu', () => {
      mainView.webContents.openDevTools({ mode: 'detach' })
    })

    return win
  }
}

// @ts-ignore
global.coreApp = new CoreApp();