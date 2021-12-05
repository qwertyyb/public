import { contextBridge, ipcRenderer } from 'electron';
import { MessageData, PublicApp, PublicPlugin } from 'src/shared/types/plugin';

let plugin: PublicPlugin;

let callbakMap = {};

interface Logger {
  info: Function,
  warn: Function,
  error: Function
}

const logger: Logger = ['info', 'warn', 'error'].reduce((obj, key) => {
  const log = (...args) => console[key](`[plugin]${getPluginPath()}`, ...args)
  return { ...obj, [key]: log }
}, {}) as Logger

const invoke = (channel: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = channel + Math.round(Math.random() * 1000)
    callbakMap[callbackName] = {
      resolve, reject
    }
    logger.info(callbackName)
    if (globalThis.window) {
      ipcRenderer.sendToHost(channel, ...args, callbackName)
    } else {
      postMessage({
        channel,
        args,
        callbackName
      })
    }
  })
}

const on = (() => {
  const events = new Map();
  if (globalThis.window) {
    return ipcRenderer.on.bind(ipcRenderer)
  } else {
    onmessage = (e: MessageEvent<MessageData>) => {
      const { channel, args } = e.data
      const handlers = events.get(channel) || []
      handlers.forEach(handler => handler(e, args))
    }
    return (channel: string, callback: Function) => {
      const handlers = events.get(channel) || []
      handlers.push(callback)
      events.set(channel, handlers)
    }
  }
})()

const getPluginPath = () => new URL(location.href).searchParams.get('pluginPath')

const getEntry = () => new URL(location.href).searchParams.get('entry')

const createIpcSender = (eventName: string) => (...args: any[]) => invoke(eventName, ...args)

const storageApi = ['setItem', 'getItem', 'removeItem', 'clear']
  .reduce((obj: Object, name) => {
    return { ...obj, [name]: createIpcSender('storage.' + name)}
  }, {}) as PublicApp["storage"]

const createSimulateMethod = method => (...args) => invoke(`simulate.${method}`, ...args)
const simulateApi = ['keyTap'].reduce((obj, key) => {
  return {
    ...obj,
    [key]: createSimulateMethod(key)
  }
}, {})

const publicApp: PublicApp = {
  storage: storageApi,
  // @todo 调用会影响全局，应校验时机
  hideMainWindow: () => invoke('app.hide'),
  db: {
    run: (sql, args) => invoke('db.run', sql, args),
    all: (sql, args) => invoke('db.all', sql, args),
    get: (sql, args) => invoke('db.get', sql, args)
  },
  simulate: simulateApi,
  getUtils: () => require('./utils'),
  enterPlugin: () => invoke('plugin.enterPlugin'),
  setList: (list) => invoke('plugin.setList', list),
  exitPlugin: () => invoke('plugin.exit'),
  pluginManager: {
    getList: () => invoke('pluginManager.getList'),
    register: (pluginPath: string) => invoke('pluginManager.register', pluginPath),
    remove: (pluginPath: string) => invoke('pluginManager.remove', pluginPath),
  },
  enableLaunchAtLogin: (enable) => invoke('app.enableLaunchAtLogin', enable),
  registerShortcuts: (settings) => invoke('app.registerShortcuts', settings),
}

const registerPlugin = (pluginPath: string) => {
  try {
    const plugin = __non_webpack_require__(pluginPath).default || __non_webpack_require__(pluginPath)
    return plugin
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

console.log(location.href)
if (getPluginPath()) {
  globalThis.publicApp = publicApp
  setImmediate(() => {
    plugin = registerPlugin(getPluginPath())

    on('message:callback', (e: MessageEvent, { type, callbackName, value }) => {
      logger.info(e, callbackName, value, callbakMap)
      if (type === 'resolve') {
        callbakMap[callbackName].resolve(value)
      } else {
        callbakMap[callbackName].reject(value)
      }
      callbakMap[callbackName] = null
    })
    on('onInput', (e, { keyword }) => {
      plugin.onInput?.(keyword)
    })
    on('onEnter', (e, { item }) => {
      plugin.onEnter(item, 0, [])
    })
  })
} else if (getEntry()) {
  globalThis.publicApp = publicApp
  const plugin = registerPlugin(getEntry())
  on('message:callback', (e, { type, callbackName, value }) => {
    logger.info(callbackName, value, callbakMap)
    if (type === 'resolve') {
      callbakMap[callbackName].resolve(value)
    } else {
      callbakMap[callbackName].reject(value)
    }
    callbakMap[callbackName] = null
  })

  contextBridge.exposeInMainWorld('publicApp', publicApp)
  contextBridge.exposeInMainWorld('_plugin', plugin)
}
