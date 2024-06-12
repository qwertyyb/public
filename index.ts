import * as path from 'path';
import { app, BrowserWindow, protocol } from "electron";
import { autoUpdater } from "electron-updater"
import * as robotjs from '@nut-tree-fork/nut-js'
import initIpc from './app/ipc'
import initTray from './app/controller/trayController'
import db from './app/controller/storageController'
require('@electron/remote/main').initialize()

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'localfile',
    privileges: {
      standard: true,
      supportFetchAPI: true,
      secure: true
    }
  }
])

export class CoreApp {
  readonly electronApp = app;
  readonly db = db;
  readonly robot = robotjs;
  mainWindow?: BrowserWindow;
  readonly updater = autoUpdater;

  constructor() {
    this.electronApp.whenReady().then(() => {
      this.mainWindow = this.createMainWindow();
      
      this.electronApp.setAccessibilitySupportEnabled(true)
    
      this.updater.checkForUpdatesAndNotify();

      initTray(this)

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
      transparent: false,
      frame: false,
      roundedCorners: false,
      visualEffectState: 'active',
      vibrancy: 'under-window',
      webPreferences: {
        webSecurity: false,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: true,
        preload: path.join(__dirname, 'app/plugin.preload.js'),
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        sandbox: false,
      }
    })
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools()
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
        }, 100)
      }
    })())
    win.on('hide', () => {
      win.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.hide'))`)
    })
    win.on('show', () => {
      win.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.show'))`)
    })
    protocol.registerFileProtocol('localfile', (request, callback) => {
      const pathname = decodeURIComponent(request.url.replace('localfile://', ''));
      callback({
        path: pathname,
        headers: {
          'Cache-Control': 'max-age=31536000'
        }
      });
    });
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