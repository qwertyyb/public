import * as path from 'path';
import { MouseClass, straightTo } from '@nut-tree-fork/nut-js';
import { CoreApp } from './index';
import { BrowserWindow, IpcMainEvent, Menu, WebContentsView, ipcMain, net } from 'electron';
import { getConfig } from './config';
import { PluginCommand } from 'shared/types/plugin';
import { execFile } from 'child_process';
import { promisify } from 'util';

const config = getConfig()

const removePluginView = (coreApp: CoreApp) => {
  if (!coreApp.pluginView) return;
  coreApp.pluginView.webContents.close()
  coreApp.mainWindow.contentView.removeChildView(coreApp.pluginView)
  coreApp.pluginView = null
}

const setPluginView = (
  coreApp: CoreApp,
  event: IpcMainEvent,
  args: {
    command: PluginCommand,
    query?: string,
    options?: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
  }
) => {
  if (coreApp.pluginView) {
    removePluginView(coreApp)
  }
  const { command, options } = args
  let entry = command.mode === 'listView' ? config.rendererEntry + '#/plugin/list-view' : options.entry
  if (!entry) return;
  const view = new WebContentsView({
    webPreferences: {
      transparent: true,
      nodeIntegration: true,
      ...options?.webPreferences,
      preload: path.join(__dirname, './preload.plugin.js'),
      additionalArguments: [JSON.stringify(args)]
    },
  })
  coreApp.mainWindow.contentView.addChildView(view)
  view.setBounds({ x: 0, y: 48, width: 780, height: 54 * 9 })
  const [port2, controlPort2] = event.ports
  view.webContents.on('dom-ready', () => {
    controlPort2.postMessage({ type: 'event', eventName: 'ready' })
    view.webContents.postMessage('port', null, [port2, controlPort2])
  })
  view.webContents.on('context-menu', () => {
    view.webContents.openDevTools({ mode: 'detach' })
  })
  if (entry.startsWith('http://') || entry.startsWith('file://')) {
    view.webContents.loadURL(entry)
  } else {
    view.webContents.loadFile(entry)
  }
  coreApp.pluginView = view
}

export default (coreApp: CoreApp) => {
  ipcMain.handle('db.run', (event, sql: string, params: Object) => {
    return coreApp.db.prepare(sql).run({ ...params })
  })
  ipcMain.handle('db.all', (event, sql: string, params: Object) => {
    return coreApp.db.prepare(sql).all({ ...params })
  })
  ipcMain.handle('db.get', (event, sql: string, params: Object) => {
    return coreApp.db.prepare(sql).get({ ...params })
  })
  ipcMain.handle('sqlite.run', async (event, dbPath: string, sql: string) => {
    const { stdout } = await promisify(execFile)('sqlite3', ['--json', '--readonly', `file:${dbPath}?immutable=1`, sql])
    return JSON.parse(stdout)
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
    const headers = [...response.headers.entries()].reduce((acc, [name, value]) => ({ ...acc, [name]: value }), {} as Record<string, string>)
    const result = {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      text: await response.text(),
      headers
    }
    return result
  })

  ipcMain.on('enter', (event, args: { command: PluginCommand, query?: string, options?: Electron.WebContentsViewConstructorOptions & { entry?: string } }) => {
    setPluginView(coreApp, event, args)
  })
  ipcMain.handle('exit', () => {
    removePluginView(coreApp)
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
