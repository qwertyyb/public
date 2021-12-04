import * as path from 'path'
import { MessageData, PublicApp, PublicPlugin } from 'src/shared/types/plugin';

let plugin: PublicPlugin;

let callbakMap = {};

interface Logger {
  info: Function,
  warn: Function,
  error: Function
}

const logger: Logger = ['info', 'warn', 'error'].reduce((obj, key) => {
  const log = (...args) => console[key]('[plugin]', ...args)
  return { ...obj, [key]: log }
}, {}) as Logger

const invoke = (channel: string, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = channel + Math.round(Math.random() * 1000)
    callbakMap[callbackName] = {
      resolve, reject
    }
    logger.info(callbackName)
    postMessage({
      channel,
      args,
      callbackName
    })
  })
}

const on = (() => {
  const events = new Map();
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
})()

const getPluginPath = () => __non_webpack_require__.resolve(new URL(location.href).searchParams.get('pluginPath'))

const createIpcSender = (eventName: string) => (...args: any[]) => invoke(eventName, ...args)

const storageApi = ['setItem', 'getItem', 'removeItem', 'clear']
  .reduce((obj: Object, name) => {
    return { ...obj, [name]: createIpcSender('plugin:storage:' + name)}
  }, {}) as PublicApp["storage"]

globalThis.publicApp = {
  storage: storageApi,
  // @todo 调用会影响全局，应校验时机
  hideMainWindow: () => invoke('HideWindow'),
  getUtils: () => require('./utils'),
  enterPlugin: () => {
    // if (!plugin.main || !plugin.main.endsWith('.html')) return;
    // const htmlPath = path.join(path.dirname(getPluginPath()), plugin.main);
    invoke('plugin:enterPlugin')
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

const registerPlugin = (pluginPath: string) => {
  try {
    const plugin = __non_webpack_require__(pluginPath).default || __non_webpack_require__(pluginPath)
    return plugin
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

setImmediate(() => {
  logger.info(getPluginPath())
  plugin = registerPlugin(getPluginPath())
  logger.info(self)


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
    logger.info('onInput', keyword)
    plugin.onInput(keyword)
  })
  on('onEnter', (e, { item }) => {
    logger.warn('onEnter')
    plugin.onEnter(item, 0, [])
  })
})
