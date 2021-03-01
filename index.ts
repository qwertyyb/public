import { app, BrowserWindow, ipcMain, protocol } from "electron";
import { autoUpdater } from "electron-updater"
import * as path from 'path';

export interface CoreApp {
  electronApp: typeof app,
  updater: typeof autoUpdater
  window: {
    main?: BrowserWindow
  }
}

var publicApp: CoreApp = {
  electronApp: app,
  updater: autoUpdater,
  window: {}
}

// @ts-ignore
global.publicApp = publicApp

const trayController = require('./app/controller/trayController')(publicApp)

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
async function createWindow () {
  ipcMain.handle('ResizeWindow', (
    event,
    arg: { width: number, height: number }
  ) => {
    console.log('resize window', arg)
    win.setSize(arg.width, arg.height)
  })
  ipcMain.handle('HideWindow', () => {
    win.hide()
  })
  const win = new BrowserWindow({
    height: 48,
    useContentSize: false,
    frame: false,
    minWidth: 720,
    width: 720,
    y: 120,
    center: true,
    show: false,
    resizable: false,
    minimizable: false, 
    maximizable: false,
    transparent: true,
    titleBarStyle: 'customButtonsOnHover',
    backgroundColor: '#00ffffff',
    vibrancy: 'sidebar',
    closable: false,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      spellcheck: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      devTools: true,
      preload: path.join(__dirname, 'app/plugin.preload.js'),
      contextIsolation: false,
    }
  })
  win.on('ready-to-show', () => {
    publicApp.window.main?.show()
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
    await installExtensions()
    win.loadURL('http://localhost:8020')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'render/build/index.html'))
  }
  publicApp.window.main = win
  return win
}


app.whenReady().then(() => {
  createWindow()
  trayController.createTray()
  app.setAccessibilitySupportEnabled(true)

  autoUpdater.checkForUpdatesAndNotify();
})
