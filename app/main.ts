import { app, BrowserWindow } from "electron";
import * as path from 'path';

function createWindow () {
  const win = new BrowserWindow({
    width: 720,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      contextIsolation: true
    }
  })
  const htmlPath = path.join(__dirname, '../views/index.html')
  win.loadFile(htmlPath)
  win.webContents.openDevTools()
}


app.whenReady().then(createWindow)
