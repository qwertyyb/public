import * as path from 'path'
import { contextBridge, ipcRenderer } from 'electron'
import * as remote from '@electron/remote'
import { PublicApp } from 'src/shared/types/plugin';

let plugin: any;

let callbakMap = {};

const invoke = (channel: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = channel + Math.round(Math.random() * 1000)
    callbakMap[callbackName] = {
      resolve, reject
    }
    console.log(callbackName)
    ipcRenderer.sendToHost(channel, ...args, callbackName)
  })
}

const getPluginPath = () => __non_webpack_require__.resolve(new URL(location.href).searchParams.get('pluginPath'))

const createIpcSender = (eventName: string) => (...args: any[]) => invoke(eventName, ...args)

const storageApi = ['setItem', 'getItem', 'removeItem', 'clear']
  .reduce((obj: Object, name) => {
    return { ...obj, [name]: createIpcSender('plugin:storage:' + name)}
  }, {}) as PublicApp["storage"]

const publicApp = {
  db: {
    run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
    all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
    get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
  },
  storage: storageApi,
  getMainWindow: () => remote.getGlobal('coreApp').mainWindow,
  // @todo 调用会影响全局，应校验时机
  hideMainWindow: () => ipcRenderer.send('HideWindow'),
  getUtils: () => require('./utils'),
  enterPlugin: () => {
    if (!plugin.main || !plugin.main.endsWith('.html')) return;
    const htmlPath = path.join(path.dirname(getPluginPath()), plugin.main);
    invoke('plugin:enterPlugin', { main: htmlPath })
  },
  pluginManager: {
    getList: () => invoke('plugin:pluginManager:getList'),
    register: (pluginPath: string) => invoke('plugin:pluginManager:register', pluginPath),
    remove: (pluginPath: string) => invoke('plugin:pluginManager:remove', pluginPath),
  },
  enableLaunchAtLogin: (enable) => invoke('plugin:enableLaunchAtLogin', enable),
  registerShortcuts: ({ shortcuts }) => invoke('plugin:registerShortcuts', { shortcuts: shortcuts }),
  setList: (list) => {
    invoke('plugin:setList', list)
  }
}

window.ipcRenderer = ipcRenderer
window.publicApp = publicApp

const registerPlugin = (pluginPath: string) => {
  try {
    const plugin = __non_webpack_require__(pluginPath).default || __non_webpack_require__(pluginPath)
    return plugin
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

setImmediate(() => {
  console.log(getPluginPath())
  plugin = registerPlugin(getPluginPath())
  contextBridge.exposeInMainWorld('publicPlugin', plugin)
  contextBridge.exposeInMainWorld('publicApp', publicApp)


  ipcRenderer.on('ipc-message:callback', (e, { callbackName, type, value }) => {
    console.log(callbackName, value, callbakMap)
    if (type === 'resolve') {
      callbakMap[callbackName].resolve(value)
    } else {
      callbakMap[callbackName].reject(value)
    }
    callbakMap[callbackName] = null
  })
  ipcRenderer.on('onInput', (e, keyword) => {
    console.log('onInput', keyword)
    plugin.onInput(keyword)
  })
  ipcRenderer.on('onEnter', (e, item) => {
    plugin.onEnter(item)
  })
})
