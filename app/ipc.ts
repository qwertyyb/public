import { MouseClass, straightTo } from '@nut-tree-fork/nut-js';
import { CoreApp } from './index';
import { BrowserWindow, Menu, ipcMain, net } from 'electron';

export default (coreApp: CoreApp) => {
  ipcMain.handle('db.run', (event, sql: string, params: Object) => {
    console.log('run', sql, params)
    return new Promise((resolve, reject) => coreApp.db.run(sql, params, (err: any, res: any, ...args: any[]) => {
      console.log('run end', err, res, ...args)
      if (err) reject(err)
      resolve(res)
    }))
  })
  ipcMain.handle('db.all', (event, sql: string, params: Object) => {
    return new Promise((resolve, reject) => coreApp.db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows)
    }))
  })
  ipcMain.handle('db.get', (event, sql: string, params: Object) => {
    return new Promise((resolve, reject) => coreApp.db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row)
    }))
  })
  ipcMain.handle('mainWindow.show', () => coreApp.mainWindow?.show())
  ipcMain.handle('mainWindow.hide', () => coreApp.electronApp.hide())

  ipcMain.handle('keyboard.type', async (event, ...keys: string[]) => {
    await coreApp.robot.keyboard.type(...keys.map(key => coreApp.robot.Key[key]))
  })
  ipcMain.handle('keyboard.holdKey', async (event, ...keys: string[]) => {
    await coreApp.robot.keyboard.pressKey(...keys.map(key => coreApp.robot.Key[key]))
  })
  ipcMain.handle('keyboard.releaseKey', async (event, ...keys: string[]) => {
    await coreApp.robot.keyboard.releaseKey(...keys.map(key => coreApp.robot.Key[key]))
  })

  ipcMain.handle('mouse.getPosition', () => coreApp.robot.mouse.getPosition())
  ipcMain.handle('mouse.setPosition', async (event, { x, y }) => { await coreApp.robot.mouse.setPosition({ x, y }) })
  ipcMain.handle('mouse.move', async (event, { x, y }) => { await coreApp.robot.mouse.move(straightTo({ x, y })) })
  ipcMain.handle('mouse.click', async (event, button: string) => { await coreApp.robot.mouse.click(coreApp.robot.Button[button]) })
  ipcMain.handle('mouse.doubleClick', async (event, button: string) => { await coreApp.robot.mouse.doubleClick(coreApp.robot.Button[button]) })
  ipcMain.handle('mouse.hold', async (event, button: string) => { await coreApp.robot.mouse.pressButton(coreApp.robot.Button[button]) })
  ipcMain.handle('mouse.relase', async (event, button: string) => { await coreApp.robot.mouse.releaseButton(coreApp.robot.Button[button]) })
  ipcMain.handle('mouse.drag', async (event, { x, y }) => { await coreApp.robot.mouse.drag(straightTo({ x, y })) })
  ipcMain.handle('mouse.scroll', async (event, { x, y }) => {
    const ps: Promise<MouseClass>[] =[]
    if (x > 0) {
      ps.push(coreApp.robot.mouse.scrollRight(x))
    } else if (x < 0) {
      ps.push(coreApp.robot.mouse.scrollLeft(-x))
    }
    if (y > 0) {
      ps.push(coreApp.robot.mouse.scrollDown(y))
    } else if (y < 0) {
      ps.push(coreApp.robot.mouse.scrollUp(-y))
    }
    await Promise.all(ps)
  })

  ipcMain.handle('fetch', async (event, url: string, init: RequestInit) => {
    const response = await net.fetch(url, init)
    const result = {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      text: await response.text()
    }
    return result
  })

  ipcMain.handle('contextmenu', event => {
    const menu = Menu.buildFromTemplate([
      { label: '打开开发者工具', role: 'toggleDevTools' }
    ])
    menu.popup({
      window: BrowserWindow.getFocusedWindow()
    })
  })
}
