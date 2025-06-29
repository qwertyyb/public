import * as path from 'path';
import * as robot from '@nut-tree-fork/nut-js';
import { CoreApp } from './index';
import { BrowserWindow, IpcMainEvent, Menu, WebContentsView, ipcMain, net } from 'electron';
import { getConfig } from './config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { type IPluginCommand } from '@public/shared'
import { register, unregister } from './shortcuts';
import { showHUD } from './hud';

const config = getConfig()

const setPluginView = async (
  coreApp: CoreApp,
  event: IpcMainEvent,
  args: {
    command: IPluginCommand,
    query?: string,
    options?: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }
  }
) => {
  const { command, options } = args
  let entry = command.mode === 'listView' ? config.rendererEntry + '#/plugin/list-view' : options?.entry
  if (!entry) return;
  const pluginViewOptions = {
    webPreferences: {
      transparent: true,
      nodeIntegration: true,
      ...options?.webPreferences,
      preload: path.join(__dirname, './preload.plugin.js'),
      additionalArguments: [JSON.stringify(args)]
    },
  }
  const view = await coreApp.createPluginView(pluginViewOptions)
  const [port2, controlPort2] = event.ports
  view.webContents.once('dom-ready', () => {
    controlPort2.postMessage({ type: 'event', eventName: 'ready' })
    view.webContents.postMessage('port', null, [port2, controlPort2])
  })
  if (entry.startsWith('http://') || entry.startsWith('file://')) {
    view.webContents.loadURL(entry)
  } else {
    view.webContents.loadFile(entry)
  }
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
    await robot.keyboard.type(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })
  ipcMain.handle('keyboard.holdKey', async (event, ...keys: string[]) => {
    await robot.keyboard.pressKey(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })
  ipcMain.handle('keyboard.releaseKey', async (event, ...keys: string[]) => {
    await robot.keyboard.releaseKey(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })

  ipcMain.handle('mouse.getPosition', () => robot.mouse.getPosition())
  ipcMain.handle('mouse.setPosition', async (event, { x, y }) => { await robot.mouse.setPosition({ x, y }) })
  ipcMain.handle('mouse.move', async (event, { x, y }) => { await robot.mouse.move(robot.straightTo({ x, y })) })
  ipcMain.handle('mouse.click', async (event, button: string) => { await robot.mouse.click(robot.Button[button as keyof typeof robot.Button]) })
  ipcMain.handle('mouse.doubleClick', async (event, button: string) => { await robot.mouse.doubleClick(robot.Button[button as keyof typeof robot.Button]) })
  ipcMain.handle('mouse.hold', async (event, button: string) => { await robot.mouse.pressButton(robot.Button[button as keyof typeof robot.Button]) })
  ipcMain.handle('mouse.relase', async (event, button: string) => { await robot.mouse.releaseButton(robot.Button[button as keyof typeof robot.Button]) })
  ipcMain.handle('mouse.drag', async (event, { x, y }) => { await robot.mouse.drag(robot.straightTo({ x, y })) })
  ipcMain.handle('mouse.scroll', async (event, { x, y }) => {
    const ps: Promise<robot.MouseClass>[] =[]
    if (x > 0) {
      ps.push(robot.mouse.scrollRight(x))
    } else if (x < 0) {
      ps.push(robot.mouse.scrollLeft(-x))
    }
    if (y > 0) {
      ps.push(robot.mouse.scrollDown(y))
    } else if (y < 0) {
      ps.push(robot.mouse.scrollUp(-y))
    }
    await Promise.all(ps)
  })

  ipcMain.handle('fetch', async (event, url: string, init: RequestInit) => {
    console.log('fetch', url, init)
    const response = await net.fetch(url, init)
    console.log('fetch response', response)
    const result = {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      headers: [...response.headers.entries()],
      arrayBuffer: await response.arrayBuffer()
    }
    return result
  })

  ipcMain.handle('showHUD', async (event, title: string, options?: { duration: 1500 }) => {
    console.log('showHUD', title, options)
    return showHUD(title, options, { mainWindow: coreApp.mainWindow! })
  })

  ipcMain.handle('shortcuts.register', (event, shortcuts: string) => {
    return register(shortcuts, () => {
      event.sender.send(`shortcuts.${shortcuts}`, shortcuts)
    })
  })
  ipcMain.handle('shortcuts.unregister', (event, shortcuts) => {
    return unregister(shortcuts)
  })

  ipcMain.on('enter', (event, args: { command: IPluginCommand, query?: string, options?: Electron.WebContentsViewConstructorOptions & { entry?: string } }) => {
    return setPluginView(coreApp, event, args)
  })
  ipcMain.handle('exit', (event, options?: { clearMainInputValue: boolean }) => coreApp.destroyPluginView(options))

  ipcMain.on('moveWindow', (event, options: { screenX: number, screenY: number, clientX: number, clientY: number }) => {
    const x = options.screenX - options.clientX
    const y = options.screenY - options.clientY
    coreApp.mainWindow?.setPosition(Math.round(x), Math.round(y))
  })
}
