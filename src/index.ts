import * as path from 'path';
import { app, BrowserWindow, protocol } from "electron";
import { autoUpdater } from "electron-updater"
import robotjs from 'robotjs'
import initIpc from './app/ipc'
import initTray from './app/controller/trayController'
import db from './app/controller/dbController';
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
  readonly robot = robotjs;
  readonly db = db;
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
      height: 480 + 32,
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
      visualEffectState: 'active',
      // vibrancy: 'under-window',
      webPreferences: {
        webviewTag: true,
        webSecurity: false,
        allowRunningInsecureContent: true,
        spellcheck: false,
        devTools: true,
        preload: path.join(__dirname, './preload/manager.js'),
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        nodeIntegrationInWorker: true,
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
        // setTimeout(() => {
        //   win.setSize(size.width, size.height)
        // }, 40)
      }
    })())
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
    } else {
      win.loadFile(path.join(__dirname, 'render/public/index.html'))
    }
    return win
  }
}

exports.coreApp = new CoreApp();