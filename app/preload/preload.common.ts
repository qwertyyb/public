import { ipcRenderer } from 'electron'
import { IPluginCommand, type PortBridge, IPublicApp, IWebviewElement, IWebviewTagAttributes } from '@public/shared'
import { runAppleScript } from 'run-applescript'
import * as utils from '../utils'

import { hanziToPinyin, getFrontmostApplication, getSelectedPath, getCurrentPath } from '@public/osx-utils';
import { exec } from 'child_process';

const debounce = <F extends (...args: any[]) => any>(fn: F, delay = 200) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), delay)
  }
}

type EventCallback = (data?: Record<string, any>) => void

const eventHandlers = new Map<string, EventCallback[]>()

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
    controlBridge?.once('ready', () => resolve(utils.createBridge(port1)))
    controlPort1.start()
    ipcRenderer.postMessage('enter', { command, options, query }, [port2, controlPort2])
  })
}

const exitPlugin = (options?: { clearMainInputValue: boolean }) => {
  console.log('exitPlugin')
  controlBridge = null
  return ipcRenderer.invoke('exit', options)
}

const createCommonAPI = (pluginName?: string): IPublicApp => {
  let keyword = ''
  let keywordChangeHandlers: ((keyword: string) => void)[] = []
  return {
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
      emitChange: (value: string) => {
        keyword = value
        keywordChangeHandlers.forEach(i => i(value))
      },
      onChange: (callback: (keyword: string) => void) => {
        keywordChangeHandlers.push(callback)
        callback(keyword)
      },
      offChange: (callback: (keyword: string) => void) => {
        keywordChangeHandlers = keywordChangeHandlers.filter(i => i !== callback)
      }
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
    fetch: async (...args: Parameters<typeof fetch>) => {
      const result = await ipcRenderer.invoke('fetch', ...args)
      return new Response(result.arrayBuffer, {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers
      });
    },
    enter: (name: string, item: IPluginCommand, options: Electron.WebContentsViewConstructorOptions & { entry?: string, preload?: string }, query?: string) => enterPlugin(name, item, options, query),
    exit: (options) => exitPlugin(options),
    shortcuts: {
      register: async (shortcuts: string, callback: () => void) => {
        const success = await ipcRenderer.invoke('shortcuts.register', shortcuts)
        if (!success) {
          throw new Error('注册失败: ' + shortcuts)
        }
        ipcRenderer.on(`shortcuts.${shortcuts}`, callback)
      },
      unregister: async (shortcuts: string, callback: () => void) => {
        ipcRenderer.off(`shortcuts.${shortcuts}`, callback)
        await ipcRenderer.invoke('shortcuts.unregister', shortcuts)
      }
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

    showHUD(title, options) {
      ipcRenderer.invoke('showHUD', title, options)
    },

    createView(options?: IWebviewTagAttributes) {
      return new Promise<IWebviewElement>(resolve => {
        window.dispatchEvent(new CustomEvent('create-view', { detail: { options, callback: resolve } }))
      })
    },

    sendToHost(channel: string, ...args: any[]) {
      return ipcRenderer.sendToHost(channel, ...args)
    },
    onHostMessage(channel: string, callback: (event: Electron.IpcRendererEvent, ...args: any[]) => void) {
      ipcRenderer.on(channel, callback)
    },
    offHostMessage(channel, callback) {
      ipcRenderer.off(channel, callback)
    },

    storage: {
      getItem: async <D extends any>(key: string): Promise<D | null> => {
        const sql = `SELECT * FROM settings where key = $key`
        const record = await window.publicApp?.db.get(sql, { key: key  })
        if (record) {
          return JSON.parse(record.value)
        }
        return null
      },
      setItem(key: string, value: string) {
        const sql = `INSERT OR REPLACE into storage(key, value) values ($key, $value)`
        return window.publicApp?.db.run(sql, {
          value: JSON.stringify(value),
          key: key
        })
      }
    },

    plugin: {
      exitCommand() {
        ipcRenderer.sendToHost('exitCommand')
      }
    },

    runAppleScript(script: string) {
      return runAppleScript(script)
    },
    runBashCommand(command: string) {
      return new Promise((resolve, reject) => exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          reject(error)
          return
        }
        resolve(stdout)
        return 
      }))
    },
  }
}

export default createCommonAPI
