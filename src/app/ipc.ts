import electron = require('electron');
import { clear, getItem, removeItem, setItem } from 'src/app/controller/storageController';
import { CoreApp } from '../index';
const { ipcMain } = electron

export default (coreApp: CoreApp) => {
  // @todo 校验来源
  ipcMain.handle('app.hide', () => {
    coreApp.electronApp.hide()
  })
  ipcMain.handle('enableLaunchAtLogin', (event, enable) => {
    electron.app.setLoginItemSettings({
      openAtLogin: enable
    })
  })
  ipcMain.handle('registerShortcuts', (event, { shortcut, shortcuts }) => {
    electron.globalShortcut.unregisterAll()
    shortcut && electron.globalShortcut.register(shortcut, () => {
      coreApp.mainWindow.show()
    })
    shortcuts.map(shortcut => {
      electron.globalShortcut.register(shortcut.shortcut, () => {
        coreApp.mainWindow.show()
        coreApp.mainWindow.webContents.executeJavaScript(`window.setQuery && window.setQuery(${JSON.stringify(shortcut.keyword)})`)
      })
    })
  })
  ipcMain.handle('storage.setItem', (event, key: string, value: string) => {
    return setItem(key, value)
  })
  ipcMain.handle('storage.getItem', (event, key: string) => {
    return getItem(key)
  })
  ipcMain.handle('storage.removeItem', (event, key: string) => {
    return removeItem(key)
  })
  ipcMain.handle('storage.clear', (event, prefix: string) => clear(prefix))
  ipcMain.handle('db.run', (event: electron.IpcMainInvokeEvent, sql: string, params: Object) => {
    console.log('run', sql, params)
    return new Promise((resolve, reject) => coreApp.db.run(sql, params, (err: any, res: any, ...args: any[]) => {
      console.log('run end', err, res, ...args)
      if (err) reject(err)
      resolve(res)
    }))
  })
  ipcMain.handle('db.all', (event: electron.IpcMainInvokeEvent, sql: string, params: Object) => {
    return new Promise((resolve, reject) => coreApp.db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows)
    }))
  })
  ipcMain.handle('db.get', (event: electron.IpcMainInvokeEvent, sql: string, params: Object) => {
    return new Promise((resolve, reject) => coreApp.db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row)
    }))
  })
  ipcMain.handle('simulate', (event, method, ...args) => {
    return coreApp.robot[method](...args)
  })
}