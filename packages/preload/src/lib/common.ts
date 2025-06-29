import { ipcRenderer } from 'electron'
import { IPublicApp, IWebview, IWebviewTagAttributes } from '@public/shared'
import { runAppleScript } from 'run-applescript'

import { exec } from 'child_process';
import { db, openCommandPreferences, openPluginPreferences, popToRoot, pushView } from './utils';
import { hanziToPinyin, getFrontmostApplication, getSelectedPath, getCurrentPath } from '@public/utils'
import { isFocusable, type createBridge } from '@public/utils/render';
import { getPlugin } from './manager';

const debounce = <F extends (...args: any[]) => any>(fn: F, delay = 200) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export const createDraggable = () => {
  let drag = false
  const distance = { x: 0, y: 0 }
  const pointerDownHandler = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const dragArea = e.clientY < 48
    const canFocus = isFocusable(e.target as Element)
    drag = dragArea && !canFocus
    if (drag) {
      distance.x = e.clientX
      distance.y = e.clientY
    }
  }

  const pointerUpHandler = (e: PointerEvent) => {
    if (e.button === 0) {
      drag = false
    }
  }

  const pointerMoveHandler = (e: PointerEvent) => {
    if (!drag) return;
    const options = { screenX: e.screenX, screenY: e.screenY, clientX: distance.x, clientY: distance.y }
    ipcRenderer.send('moveWindow', options)
  }
  window.addEventListener('pointerdown', pointerDownHandler, true)
  window.addEventListener('pointerup', pointerUpHandler, true)
  window.addEventListener('pointermove', pointerMoveHandler, true)
  window.addEventListener('pointercancel', pointerUpHandler, true)
}

const createCommonAPI = ({ runtime, pluginName } : { runtime: 'main' | 'plugin', pluginName?: string }): IPublicApp => {

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
      pushView: (options: { path: string, params?: any }) => {
        pushView(options)
      },
      popToRoot(options?: { clearInput?: boolean }) {
        window.dispatchEvent(new CustomEvent('pop-to-root', { detail: { ...options } }))
      },
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

    createView(pluginName: string, options?: IWebviewTagAttributes) {
      return new Promise<{ webview: IWebview, bridge: ReturnType<typeof createBridge> }>(resolve => {
        pushView({  path: '/plugin/view', params: { plugin: getPlugin(pluginName), options, callback: resolve } })
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
      async setItem(key, value) {
        const doc = await db.get<{ value: any }>(pluginName ? `plugin/${pluginName}/${key}` : key).catch(err => {
          console.error(err)
          return null
        })
        const data: { _id: string, _rev?: string, value: any } = { value, _id: pluginName ? `plugin/${pluginName}/${key}` : key }
        if (doc) {
          data._rev = doc._rev
        }
        return db.put(data)
      },
      getItem<T extends any>(key: string) {
        return db.get<{ value: T }>(pluginName ? `plugin/${pluginName}/${key}` : key).then(result => result.value).catch(err => {
          console.error(err)
          return null
        })
      },
      async removeItem(key) {
        const doc = await db.get<{ value: any }>(pluginName ? `plugin/${pluginName}/${key}` : key).catch(err => {
          console.error(err)
          return null
        })
        if (doc) {
          await db.remove(doc)
        }
      }
    },

    plugin: {
      exitCommand() {
        if (runtime === 'main') {
          popToRoot()
        } else {
          ipcRenderer.sendToHost('exitCommand')
        }
      },
      getPreferenceValues(pluginName: string, commandName?: string) {
        if (commandName) {
          return getPlugin(pluginName)?.settings?.commands?.[commandName]?.preferences || {}
        }
        return getPlugin(pluginName)?.settings?.preferences || {}
      },
      openPreferences(pluginName?: string, commandName?: string) {
        // @todo 需要考虑首页的支持情况
        if (commandName) {
          return openCommandPreferences(pluginName!, commandName)
        }
        return openPluginPreferences(pluginName!)
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
    }
  }
}

export default createCommonAPI
