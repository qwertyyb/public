import * as path from 'path';
import { app, BrowserWindow, Menu, protocol, type Tray } from "electron";
import { autoUpdater } from "electron-updater"
import * as robotjs from '@nut-tree-fork/nut-js'
import initIpc from './ipc'
import initTray from './controller/trayController'
import db from './controller/storageController'
require('@electron/remote/main').initialize()

export class CoreApp {
  readonly electronApp = app;
  readonly db = db;
  readonly robot = robotjs;
  tray: Tray;
  mainWindow?: BrowserWindow;
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
    const win = new BrowserWindow({
      height: 48,
      useContentSize: false,
      minWidth: 780,
      width: 780,
      y: 120,
      center: true,
      show: false,
      resizable: false,
      minimizable: false, 
      maximizable: false,
      transparent: true,
      frame: false,
      roundedCorners: false,
      vibrancy: 'under-window',
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
    if (process.env.NODE_ENV === 'development') {
      // win.webContents.openDevTools()
    }
    win.on('ready-to-show', () => {
      win.show()
      require("@electron/remote/main").enable(win.webContents)
    })
    win.webContents.on('preferred-size-changed', (() => {
      let timeout = null
      return (event, size) => {
        timeout && clearTimeout(timeout)
        setTimeout(() => {
          win.setSize(size.width, size.height)
        }, 10)
      }
    })())
    win.webContents.setWindowOpenHandler((detail) => {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            nodeIntegration: true
          }
        }
      }
    })
    win.on('hide', () => {
      win.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.hide'))`)
    })
    win.on('show', () => {
      win.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.show'))`)
    })
    if (process.env.NODE_ENV === 'development') {
      // await installExtensions()
      win.loadURL('http://localhost:5000')
    } else {
      win.loadFile(path.join(__dirname, 'render/public/index.html'))
    }
    return win
  }
}

// @ts-ignore
global.coreApp = new CoreApp();