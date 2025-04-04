import { ipcRenderer } from 'electron'
import { IPluginCommand, type PortBridge, IPublicApp } from '@public/shared'
import * as utils from '../utils'

import { hanziToPinyin, getFrontmostApplication, getSelectedPath, getCurrentPath } from '@public/osx-utils';

const debounce = <F extends (...args: any[]) => any>(fn: F) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), 200)
  }
}

let controlBridge: PortBridge | null = null
const enterPlugin = (
  name: string,
  command: IPluginCommand,
  options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string },
  query?: string
) => {
  console.log(name, command, query)
  window.dispatchEvent(new CustomEvent('inputBar.enter', { detail: { name, command, query } }))

  // 搞两个 channel, 一个用来做 API 控制层调用，另一个将会插件做通信
  const { port1, port2 } = new MessageChannel()
  const { port1: controlPort1, port2: controlPort2 } = new MessageChannel()
  return new Promise<PortBridge>(resolve => {
    controlBridge = utils.createBridge(controlPort1)
    controlBridge?.handle('inputBar.disable', ({ disable }) => {
      window.dispatchEvent(new CustomEvent('inputBar.disable', { detail: { disable } }))
    })
    controlBridge?.once('ready', () => resolve(utils.createBridge(port1)))
    controlPort1.start()
    ipcRenderer.postMessage('enter', { command, options, query }, [port2, controlPort2])
  })
}

const exitPlugin = () => {
  controlBridge = null
  return ipcRenderer.invoke('exit')
}

const createCommonAPI = (): IPublicApp => ({
  db: {
    run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
    all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
    get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
  },
  sqlite: {
    run: (dbPath: string, sql: string, params?: Object) => ipcRenderer.invoke('sqlite.run', dbPath, sql, params),
  },
  mainWindow: {
    show: () => ipcRenderer.invoke('mainWindow.show'),
    hide: () => ipcRenderer.invoke('mainWindow.hide'),
  },
  inputBar: {
    setValue: (value: string) => { controlBridge?.invoke('setInputValue', { value }) },
  },
  keyboard: {
    type: (...keys: string[]) => ipcRenderer.invoke('keyboard.type', ...keys),
    holdKey: (...keys: string[]) => ipcRenderer.invoke('keyboard.holdkey', ...keys),
    releaseKey: (...keys: string[]) => ipcRenderer.invoke('keyboard.releaseKey', ...keys),
  },
  mouse: {
    getPosition: () => ipcRenderer.invoke('mouse.getPosition'),
    setPosition: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.setPosition', point),
    move: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.move', point),
    click: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.click', button),
    doubleClick: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.doubleClick', button),
    hold: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.hold', button),
    release: (button: 'LEFT' | 'MIDDLE' | 'RIGHT') => ipcRenderer.invoke('mouse.release', button),
    drag: (point: {x: number, y: number}) => ipcRenderer.invoke('mouse.drag', point),
    scroll: (point: {x?: number, y?: number}) => ipcRenderer.invoke('mouse.scroll', point),
  },
  fetch: (...args: Parameters<typeof fetch>) => ipcRenderer.invoke('fetch', ...args),

  enter: (name: string, item: IPluginCommand, options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }, query?: string) => enterPlugin(name, item, options, query),
  exit: () => {
    return exitPlugin()
  },

  utils: {
    debounce,
    getFrontmostApplication,
    getSelectedPath,
    getCurrentPath,
    hanziToPinyin,
  },
  showToast(options: {
    title?: string,
    icon?: 'success' | 'error' | 'loading' | 'none',
    image?: string,
    duration?: number
  }) {
    const toast = document.createElement('div')
    toast.classList.add('toast')
    toast.textContent = options.title || ''
    toast.style.cssText = 'position:fixed;left:50%;bottom:10vh;transform:translateX(-50%);background:rgba(0,0,0,8);color:#fff;padding:6px 12px;border-radius:4px;z-index:999';
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, options.duration || 2500)
  },
  // showModal(options: Partial<{
  //   title: string,
  //   content: string,
  //   showCancel: boolean,
  //   cancelText: string,
  //   confirmText: string,
  //   cancelColor: string,
  //   confirmColor: string,
  // }>) {
    
  // },
  // showLoading() {},
  // hideLoading() {}
})

export default createCommonAPI
