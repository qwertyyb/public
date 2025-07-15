import * as path from 'path';
import * as robot from '@nut-tree-fork/nut-js';
import { CoreApp } from './index';
import { IpcMainEvent, ipcMain, net } from 'electron';
import { getConfig } from './config';
import { execFile } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log/main'
import { type IPluginCommand } from '@public/shared'
import { register, unregister } from './shortcuts';
import { showHUD } from './hud';
import { pouchDB } from './controller/storageController';

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
    log.info('db.run', sql)
    return coreApp.db.prepare(sql).run({ ...params })
  })
  ipcMain.handle('db.all', (event, sql: string, params: Object) => {
    log.info('db.all', sql, params)
    return coreApp.db.prepare(sql).all({ ...params })
  })
  ipcMain.handle('db.get', (event, sql: string, params: Object) => {
    log.info('db.get', sql, params)
    return coreApp.db.prepare(sql).get({ ...params })
  })
  ipcMain.handle('sqlite.run', async (event, dbPath: string, sql: string) => {
    log.info('sqlite.run', dbPath, sql)
    const { stdout } = await promisify(execFile)('sqlite3', ['--json', '--readonly', `file:${dbPath}?immutable=1`, sql])
    return JSON.parse(stdout)
  })
  ipcMain.handle('mainWindow.show', () => {
    log.info('mainWindow.show')
    return coreApp.mainWindow?.show()
  })
  ipcMain.handle('mainWindow.hide', () => {
    log.info('mainWindow.hide')
    return coreApp.electronApp.hide()
  })

  ipcMain.handle('keyboard.type', async (event, ...keys: string[]) => {
    log.info('keyboard.type', ...keys)
    await robot.keyboard.type(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })
  ipcMain.handle('keyboard.holdKey', async (event, ...keys: string[]) => {
    log.info('keyboard.holdKey', ...keys)
    await robot.keyboard.pressKey(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })
  ipcMain.handle('keyboard.releaseKey', async (event, ...keys: string[]) => {
    log.info('keyboard.releaseKey', ...keys)
    await robot.keyboard.releaseKey(...keys.map(key => robot.Key[key as keyof typeof robot.Key]))
  })

  ipcMain.handle('mouse.getPosition', () => {
    log.info('mouse.getPosition')
    return robot.mouse.getPosition()
  })
  ipcMain.handle('mouse.setPosition', async (event, { x, y }) => {
    log.info('mouse.setPosition', { x, y })
    await robot.mouse.setPosition({ x, y })
  })
  ipcMain.handle('mouse.move', async (event, { x, y }) => { 
    log.info('mouse.move', { x, y })
    await robot.mouse.move(robot.straightTo({ x, y })) })
  ipcMain.handle('mouse.click', async (event, button: string) => {
    log.info('mouse.click', button)
    await robot.mouse.click(robot.Button[button as keyof typeof robot.Button])
  })
  ipcMain.handle('mouse.doubleClick', async (event, button: string) => {
    log.info('mouse.doubleClick', button)
    await robot.mouse.doubleClick(robot.Button[button as keyof typeof robot.Button])
  })
  ipcMain.handle('mouse.hold', async (event, button: string) => {
    log.info('mouse.hold', button)
    await robot.mouse.pressButton(robot.Button[button as keyof typeof robot.Button])
  })
  ipcMain.handle('mouse.relase', async (event, button: string) => {
    log.info('mouse.relase', button)
    await robot.mouse.releaseButton(robot.Button[button as keyof typeof robot.Button])
  })
  ipcMain.handle('mouse.drag', async (event, { x, y }) => {
    log.info('mouse.drag', { x, y })
    await robot.mouse.drag(robot.straightTo({ x, y }))
  })
  ipcMain.handle('mouse.scroll', async (event, { x, y }) => {
    log.info('mouse.scroll', { x, y })
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
    log.info('fetch', url, init)
    const response = await net.fetch(url, init)
    log.info('fetch response', response)
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
    return showHUD(title, options, { mainWindow: coreApp.mainWindow! })
  })

  ipcMain.handle('shortcuts.register', (event, shortcuts: string) => {
    return register(shortcuts, () => {
      log.info('shortcuts callback', shortcuts)
      event.sender.send(`shortcuts.${shortcuts}`, shortcuts)
    })
  })
  ipcMain.handle('shortcuts.unregister', (event, shortcuts) => {
    return unregister(shortcuts)
  })

  ipcMain.handle('storage.getItem', async (event, key: string) => {
    log.info('storage.getItem', key)
    return pouchDB.get<{ value: any }>(key).then(result => result.value).catch(err => {
      return undefined
    })
  })
  ipcMain.handle('storage.setItem', async (event, key: string, value: any) => {
    log.info('storage.setItem', key)
    const doc = await pouchDB.get<{ value: any }>(key).catch(err => {
      console.error(err)
      return null
    })
    const data: { _id: string, _rev?: string, value: any } = { value, _id: key }
    if (doc) {
      data._rev = doc._rev
    }
    return pouchDB.put(data)
  })
  ipcMain.handle('storage.removeItem', async (event, key: string) => {
    log.info('storage.removeItem', key)
    const doc = await pouchDB.get<{ value: any }>(key).catch(err => {
      console.error(err)
      return null
    })
    if (doc) {
      return pouchDB.remove(doc)
    }
  })

  ipcMain.on('enter', (event, args: { command: IPluginCommand, query?: string, options?: Electron.WebContentsViewConstructorOptions & { entry?: string } }) => {
    return setPluginView(coreApp, event, args)
  })
  ipcMain.handle('exit', (event, options?: { clearMainInputValue: boolean }) => coreApp.destroyPluginView(options))

  ipcMain.on('moveWindow', (event, options: { screenX: number, screenY: number, clientX: number, clientY: number }) => {
    log.info('moveWindow', options)
    const x = options.screenX - options.clientX
    const y = options.screenY - options.clientY
    coreApp.mainWindow?.setPosition(Math.round(x), Math.round(y))
  })
}
