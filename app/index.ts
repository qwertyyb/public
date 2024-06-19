import * as path from 'path';
import { app, BaseWindow, BrowserWindow, Menu, protocol, WebContentsView, type Tray } from "electron";
import { autoUpdater } from "electron-updater"
import * as robotjs from '@nut-tree-fork/nut-js'
import initIpc from './ipc.js'
import initTray from './controller/trayController'
import db from './controller/storageController'
require('@electron/remote/main').initialize()

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
      roundedCorners: false,
    })
    const mainView = new WebContentsView({
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: true,
        preload: path.join(__dirname, './plugin.preload.js'),
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        sandbox: false,
      }
    })
    this.mainView = mainView
    win.contentView.addChildView(mainView)
    mainView.setBounds({ x: 0, y: 0, width: 780, height: 600 })
    require("@electron/remote/main").enable(mainView.webContents)

    mainView.webContents.on('preferred-size-changed', (() => {
      let timeout = null
      return (event, size) => {
        timeout && clearTimeout(timeout)
        if (this.pluginView) {
          win.setSize(780, 48 + 54 * 9)
        } else {
          setTimeout(() => {
            mainView.setBounds({ ...mainView.getBounds(), height: size.height })
            win.setSize(780, size.height)
          }, 10)
        }
      }
    })())
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
    if (process.env.NODE_ENV === 'development') {
      // await installExtensions()
      mainView.webContents.loadURL('http://localhost:3000')
    } else {
      mainView.webContents.loadFile(path.join(__dirname, 'render/public/index.html'))
    }

    return win
  }
}

// @ts-ignore
global.coreApp = new CoreApp();