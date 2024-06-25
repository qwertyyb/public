import { ipcRenderer } from 'electron'
import type { CommonListItem } from 'shared/types/plugin'

export default () => ({
  db: {
    run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
    all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
    get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
  },
  mainWindow: {
    show: () => ipcRenderer.invoke('mainWindow.show'),
    hide: () => ipcRenderer.invoke('mainWindow.hide'),
  },
  inputBar: {
    setValue: (value: string) => { window.dispatchEvent(new CustomEvent('inputBar.setValue', { detail: { value } })) },
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

  // @ts-ignore
  enter: (name: string, item: CommonListItem, args: any) => window.PluginManager.enterPlugin(name, item, args),
  exit: (name: string) => window.PluginManager.exitPlugin(name)
})
