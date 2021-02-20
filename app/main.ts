import { app, BrowserWindow, globalShortcut, ipcMain, protocol } from "electron";
import * as path from 'path';
// import registerAllPlugin from './plugin';
import { IPCEventName } from './shared/constant';

function createWindow () {
  ipcMain.handle('ResizeWindow', (event, arg: Size) => {
    win.setSize(arg.width, arg.height)
  })
  ipcMain.on('getApplicationIcon', async (event, args) => {
    console.log('getApplicationIcon', args)
    const icon = await app.getFileIcon(args.path);
    event.reply(`getApplicationIcon-${args.path}`, icon.toDataURL())
  })
  const win = new BrowserWindow({
    // width: 720,
    height: 60,
    useContentSize: true,
    frame: false,
    minWidth: 720,
    webPreferences: {
      // webSecurity: false,
      nodeIntegration: true,
      devTools: true,
      preload: path.join(__dirname, './main/preload.js'),
      contextIsolation: false
    }
  })
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
  // registerAllPlugin()
  app.setAccessibilitySupportEnabled(true)
  protocol.registerFileProtocol('localfile', (request, callback) => {
    const pathname = decodeURIComponent(request.url.replace('localfile:///', ''));
    callback(pathname);
  });
})

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll()
})

