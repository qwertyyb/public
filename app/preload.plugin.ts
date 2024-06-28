import { ipcRenderer } from "electron"
import EventEmitter from "events"
import createAPI from './preload/preload.api'
import { ListItem } from "shared/types/plugin"

declare global {
  interface PublicApp {
    setList?: (list: ListItem[]) => void,
  }

  interface PluginData {
    list: ListItem[]
  }

  var pluginData: PluginData
}

const createBridge = (port: MessagePort) => {
  const eventBus = new EventEmitter()
  const callbackMap = new Map<string, { resolve: Function, reject: Function }>()
  port.addEventListener('message', (event: MessageEvent) => {
    const { type } = event.data
    if (type === 'event') {
      const { eventName, payload } = event.data
      eventBus.emit(eventName, payload)
      return
    }
    if (type === 'callback') {
      const { callbackName, returnValue, error } = event.data
      const { resolve, reject } = callbackMap.get(callbackName)
      if (error) {
        reject?.(new Error(error))
      } else {
        resolve?.(returnValue)
      }
      callbackMap.delete(callbackName)
    }
  })
  return {
    invoke(methodName: string, args?: any) {
      return new Promise((resolve, reject) => {
        const callbackName = `${methodName}_${Math.random()}`
        callbackMap.set(callbackName, { resolve, reject })
        const item = {
          type: 'method',
          methodName,
          args,
          callbackName
        }
        port.postMessage(item)
      })
    },
    on: eventBus.on.bind(eventBus)
  }
}

const createPortHandle = () => {
  const callbackMap = new Map()
  let queue = []
  let controlPort2: MessagePort | null = null
  const eventBus = new EventEmitter()
  ipcRenderer.on('port', event => {
    controlPort2 = event.ports[1]
    const port2 = event.ports[1]
    controlPort2?.addEventListener('message', (event: MessageEvent) => {
      const { type } = event.data
      if (type === 'event') {
        const { eventName, payload } = event.data
        eventBus.emit(eventName, payload)
        return
      }
      if (type === 'callback') {
        const { callbackName, returnValue, error } = event.data
        const { resolve, reject } = callbackMap.get(callbackName)
        if (error) {
          reject?.(new Error(error))
        } else {
          resolve?.(returnValue)
        }
        callbackMap.delete(callbackName)
      }
    })
    controlPort2.start()
    queue.slice().forEach(item => controlPort2?.postMessage(item))
    queue = []
  })
  return {
    invoke(methodName: string, args?: any) {
      return new Promise((resolve, reject) => {
        const callbackName = `${methodName}_${Math.random()}`
        callbackMap.set(callbackName, { resolve, reject })
        const item = {
          type: 'method',
          methodName,
          args,
          callbackName
        }
        if (controlPort2) {
          controlPort2.postMessage(item)
        } else {
          queue.push(item)
        }
      })
    },
    on: eventBus.on.bind(eventBus)
  }
}

const portHandle = createPortHandle()

window.pluginData = {
  list: []
}
window.publicApp = {
  ...createAPI(),
  setList: (list) => {
    window.dispatchEvent(new CustomEvent('listchanged', { detail: { list } }))
    window.pluginData.list = list
  }
}

declare global {
  interface Window {
    portHandle: typeof portHandle,
    plugin?: any,
  }
}

const preload = new URL(location.href).searchParams.get('preload')
if (preload) {
  const plugin = __non_webpack_require__(preload)

  window.plugin = plugin?.default || plugin
  
  if (!window.plugin?.search) {
    // 没有 search 函数，禁用输入框
    portHandle.invoke('inputBar.disable', { disable: true })
  }
}

portHandle.on('inputValueChanged', async (value: string) => {
  window.dispatchEvent(new CustomEvent('inputBar.setValue', { detail: { value } }))
})

window.portHandle = portHandle
