import electron = require('electron');
import { CoreApp } from 'index';
const { ipcMain } = electron

export default (coreApp: CoreApp) => {
  ipcMain.on('HideWindow', () => {
    coreApp.electronApp.hide()
  })
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
}