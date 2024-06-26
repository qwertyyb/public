import { ipcRenderer } from "electron"
import EventEmitter from "events"
import createAPI from './preload/preload.api'

window.publicApp = createAPI()

const createPortHandle = () => {
  const callbackMap = new Map()
  let queue = []
  let port: MessagePort | null = null
  const eventBus = new EventEmitter()
  ipcRenderer.on('port', event => {
    port = event.ports[0]
    port?.addEventListener('message', (event: MessageEvent) => {
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
    port.start()
    queue.slice().forEach(item => port?.postMessage(item))
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
        if (port) {
          port?.postMessage(item)
        } else {
          queue.push(item)
        }
      })
    },
    on: eventBus.on.bind(eventBus)
  }
}

const portHandle = createPortHandle()

declare global {
  interface Window {
    portHandle: typeof portHandle,
    plugin?: any,
  }
}

const preload = new URL(location.href).searchParams.get('preload')
if (preload) {
  const plugin = __non_webpack_require__(preload)

  window.plugin = plugin.default || plugin
}

portHandle.on('inputValueChanged', async (value: string) => {
  window.dispatchEvent(new CustomEvent('inputBar.setValue', { detail: { value } }))
})

window.portHandle = portHandle
