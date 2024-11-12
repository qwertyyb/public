import * as path from 'path';
import { app, BaseWindow, WebContentsView, type Tray } from "electron";
import { autoUpdater } from "electron-updater"
import initIpc from './ipc'
import initTray from './controller/trayController'
import db from './controller/storageController'
import { getConfig } from './config';
import * as shortcuts from './shortcuts';
import { dispatchShortcutsEvent, injectWindowEventsToWebContents, sendInputEventToPluginView } from './events';
import { registerIPublicProtocol } from './protocol';
require('@electron/remote/main').initialize();

const config = getConfig()

app.setActivationPolicy('accessory')

export class CoreApp {
  readonly electronApp = app;
  readonly db = db;
  tray: Tray | null = null;
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

      registerIPublicProtocol()
    })
    
    this.electronApp.on('window-all-closed', () => {
      this.electronApp.quit();
    });

    shortcuts.on('shortcuts', (event: { shortcuts: string }) => {
      if (this.mainView) {
        dispatchShortcutsEvent(this.mainView.webContents, event)
      }
    })
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
      roundedCorners: true,
      backgroundColor: '#e5e8e8'
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
        sandbox: false,
        transparent: true
      }
    })
    this.mainView = mainView
    win.contentView.addChildView(mainView)
    mainView.setBounds({ x: 0, y: 0, width: 780, height: 600 })
    require("@electron/remote/main").enable(mainView.webContents)

    sendInputEventToPluginView(this)
    injectWindowEventsToWebContents(win, mainView.webContents)
    mainView.webContents.loadURL(config.rendererEntry)

    mainView.webContents.on('context-menu', () => {
      mainView.webContents.openDevTools({ mode: 'detach' })
    })

    return win
  }
}

// @ts-ignore
global.coreApp = new CoreApp();
