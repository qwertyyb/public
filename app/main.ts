import { app, BrowserWindow, globalShortcut } from "electron";
import * as path from 'path';
import registerAllPlugin from './plugin';

function createWindow () {
  const win = new BrowserWindow({
    // width: 720,
    height: 660,
    useContentSize: true,
    frame: false,
    minWidth: 720,
    // transparent: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      preload: path.join(__dirname, './main/preload.js')
      // contextIsolation: true
    }
  })
  const htmlPath = path.join(__dirname, '../app/views/index.html')
  win.loadURL('http://localhost:8020')
  win.webContents.openDevTools()
}

const registerShortcut = () => {
  globalShortcut.register('CommandOrControl+Space', () => {
    app.focus({
      steal: true
    })
  })
}


app.whenReady().then(() => {
  createWindow()
  registerShortcut()
  registerAllPlugin()
  app.setAccessibilitySupportEnabled(true)
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})

