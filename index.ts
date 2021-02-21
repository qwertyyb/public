import { app, BrowserWindow, globalShortcut, ipcMain, protocol, Tray } from "electron";
import { PublicApp } from "global";
import * as path from 'path';

const publicApp: PublicApp = {
  electronApp: app,
  window: {}
}

const shortcutsController = require('./app/controller/shortcutsController')(publicApp)
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

async function createWindow () {
  ipcMain.handle('ResizeWindow', (event, arg: Size) => {
    win.setSize(arg.width, arg.height)
  })
  ipcMain.handle('HideWindow', () => {
    win.hide()
  })
  await installExtensions();
  const win = new BrowserWindow({
    height: 660,
    useContentSize: true,
    frame: false,
    minWidth: 720,
    y: 180,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      preload: path.join(__dirname, './app/plugin.preload.js'),
      contextIsolation: false
    }
  })
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const pathname = decodeURIComponent(request.url.replace('localfile:///', ''));
    callback(pathname);
  });
  // setTimeout(() => {
    win.loadURL('http://localhost:8020/#/settings')
  // }, 3000)
  win.webContents.openDevTools()
  publicApp.window.main = win
  return win
}


app.whenReady().then(() => {
  createWindow()
  shortcutsController.register()
  trayController.createTray()
  app.setAccessibilitySupportEnabled(true)
})

app.on('will-quit', () => {
  // 注销所有快捷键
  shortcutsController.unregisterAll()
})

