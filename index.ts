import { app, BrowserWindow, globalShortcut, ipcMain, protocol } from "electron";
import { autoUpdater } from "electron-updater"
import * as path from 'path';
import initIpc from './app/ipc'
import initTray from './app/controller/trayController'
import db from './app/controller/storageController'
require('./app/controller/storageController')
require('@electron/remote/main').initialize()
// @ts-ignore
// global.publicApp = publicApp

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
  mainWindow?: BrowserWindow;
  readonly updater = autoUpdater;

  constructor() {
    this.electronApp.allowRendererProcessReuse = false

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
      transparent: true,
      frame: false,
      roundedCorners: false,
      vibrancy: 'content',
      webPreferences: {
        // enableBlinkFeatures: 'WebBluetooth',
        webSecurity: false,
        allowRunningInsecureContent: true,
        spellcheck: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        devTools: true,
        preload: path.join(__dirname, 'app/plugin.preload.js'),
        contextIsolation: false,
        backgroundThrottling: false,
      }
    })
    win.on('ready-to-show', () => {
      win.show()
    })
    win.on('hide', () => {
      console.log('hide')
      win.webContents.executeJavaScript(`window.clearAndFocusInput && window.clearAndFocusInput()`)
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
      win.webContents.openDevTools()
    } else {
      win.loadFile(path.join(__dirname, 'render/public/index.html'))
    }
    return win
  }
}

// @ts-ignore
global.coreApp = new CoreApp();