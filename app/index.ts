import * as path from 'path';
import { app, BaseWindow, desktopCapturer, Menu, protocol, session, WebContentsView, type Tray } from "electron";
import { autoUpdater } from "electron-updater"
import initIpc from './ipc'
import initTray from './controller/trayController'
import db from './controller/storageController'
import { getConfig } from './config';
import { registerIPublicProtocol } from './protocol';
import { pathToFileURL } from 'url';
require('@electron/remote/main').initialize();

const config = getConfig()

app.setActivationPolicy('accessory')

export class CoreApp {
  readonly electronApp = app;
  readonly db = db;
  tray: Tray | null = null;
  readonly mainWindow?: BaseWindow;
  private mainView?: WebContentsView;
  private pluginView?: WebContentsView;
  readonly updater = autoUpdater;

  constructor() {
    this.electronApp.whenReady().then(() => {
      this.initPluginSession()
      this.createMainWindow()

      session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
          console.log(request, sources)
          // Grant access to the first screen found.
          callback({ video: sources[0] })
        })
        // If true, use the system picker if available.
        // Note: this is currently experimental. If the system picker
        // is available, it will be used and the media request handler
        // will not be invoked.
      }, { useSystemPicker: true })
      
      this.electronApp.setAccessibilitySupportEnabled(true)
    
      this.updater.checkForUpdatesAndNotify();

      this.tray = initTray(this)

      initIpc(this)

      registerIPublicProtocol(protocol)
    })
    
    this.electronApp.on('window-all-closed', () => {
      this.electronApp.quit()
    })
  }

  private initPluginSession() {
    const ses = session.fromPartition('plugin')
    ses.registerPreloadScript({ type: 'frame', filePath: path.join(__dirname, './preload.plugin.js'), id: 'API' })
    ses.protocol.handle('local', (request) => {
      const filePath = request.url.slice('atom://'.length)
      return ses.fetch(pathToFileURL(path.resolve(__dirname, filePath)).toString())
    })
    registerIPublicProtocol(ses.protocol)
  }

  private createMainWindow() {
    const win = new BaseWindow({
      height: config.windowHeight,
      useContentSize: false,
      minWidth: config.windowWidth,
      width: config.windowWidth,
      y: 120,
      center: true,
      show: true,
      resizable: false,
      minimizable: false, 
      maximizable: false,
      frame: false,
      hiddenInMissionControl: true,
      skipTaskbar: true,
      roundedCorners: true,
      vibrancy: 'popover',
      visualEffectState: 'followWindow',
    })
    // @ts-ignore
    this.mainWindow = win
    const mainView = new WebContentsView({
      webPreferences: {
        spellcheck: false,
        devTools: true,
        preload: path.join(__dirname, './preload.main.js'),
        contextIsolation: false,
        backgroundThrottling: false,
        sandbox: false,
        transparent: true,
        webviewTag: true,
      }
    })
    this.mainView = mainView
    win.contentView.addChildView(mainView)
    mainView.setBounds({ x: 0, y: 0, width: config.windowWidth, height: config.windowHeight })
    require("@electron/remote/main").enable(mainView.webContents)
    this.sendWindowEventsToMainView()
    mainView.webContents.loadURL(config.rendererEntry)
     mainView.webContents.on('context-menu', () => {
      mainView.webContents.openDevTools({ mode: 'detach' })
    })

    return win
  }

  private sendWindowEventsToMainView() {
    if (!this.mainWindow || !this.mainView) return
    this.mainWindow.on('hide', () => {
      this.mainView?.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.hide'))`)
    })
    this.mainWindow.on('show', () => {
      console.log('mainWindow show')
      this.mainView?.webContents.focus()
      this.mainView?.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.show'))`)
    }) 
    // this.mainWindow.on('blur', () => {
    //   this.mainView?.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.mainWindow.blur'))`)
    // }) 
  }

  public async createPluginView(options: Electron.WebContentsViewConstructorOptions) {
    console.log('createPluginView', options)
    if (this.pluginView) {
      await this.destroyPluginView()
    }
    const view = new WebContentsView(options)
    view.setVisible(false)
    this.mainWindow?.contentView.addChildView(view)
    view.setBounds({ x: 0, y: 0, width: config.windowWidth, height: config.windowHeight })
    view.webContents.once('did-finish-load', () => {
      this.mainView?.setVisible(false)
      view.setVisible(true)
      view.webContents.focus()
    })
    view.webContents.on('context-menu', () => {
      view.webContents.openDevTools({ mode: 'detach' })
    })
    this.pluginView = view
    return view
  }

  public async destroyPluginView(options?: { clearMainInputValue: boolean }) {
    console.log('destroyPluginView', options)
    this.mainView?.setVisible(true)
    if (!this.pluginView) return;
    this.mainView?.webContents.focus()
    this.pluginView.webContents.close()
    this.mainWindow?.contentView.removeChildView(this.pluginView)
    this.pluginView = undefined
    await this.mainView?.webContents.executeJavaScript(`window.dispatchEvent(new CustomEvent('publicApp.plugin.exited', { detail: { options: ${JSON.stringify(options || {})} } }))`)
  }
}
// @ts-ignore
global.coreApp = new CoreApp();
