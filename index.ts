import { app, BrowserWindow, globalShortcut, ipcMain, protocol } from "electron";
import { autoUpdater } from "electron-updater"
import * as path from 'path';
require('@electron/remote/main').initialize()

app.allowRendererProcessReuse = false
console.log(process.versions.modules, process.versions)
export interface CoreApp {
  electronApp: typeof app,
  updater: typeof autoUpdater,
  window: {
    main?: BrowserWindow
  }
}

var publicApp: CoreApp = {
  electronApp: app,
  updater: autoUpdater,
  window: {},
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
  ipcMain.on('ResizeWindow', (
    event,
    arg: { width: number, height: number }
  ) => {
    console.log('resize window', arg)
    win.setSize(arg.width, arg.height)
  })
  ipcMain.on('HideWindow', () => {
    app.hide()
  })
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
    titleBarStyle: 'customButtonsOnHover',
    fullscreenWindowTitle: true,
    frame: false,
    backgroundColor: '#f4ffffff',
    webPreferences: {
      enableBlinkFeatures: 'WebBluetooth',
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
    publicApp.window.main?.show()
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
    await installExtensions()
    win.loadURL('http://localhost:5000')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'render/public/index.html'))
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

app.on('window-all-closed', () => {
  app.quit();
});