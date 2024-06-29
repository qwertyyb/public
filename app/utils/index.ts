import * as pinyin from 'tiny-pinyin'
import EventEmitter from 'events'

export const pinyinMatch = (hanzi: string, keyword: string) => {
  const pyword = pinyin.convertToPinyin(hanzi, '-', true)
  // @ts-ignore
  return pyword.replaceAll('-', '').includes(keyword) // 全拼音匹配
    || pyword.split('-').map(a => a[0]).filter(b => b).join('').includes(keyword)
}

export const match = (candidate: string[] | string, keyword: string) => {
  if (!keyword) return false;
  const arr = Array.isArray(candidate) ? candidate : [candidate]
  const k = keyword.toLowerCase()
  return arr.some(element => element?.toLowerCase().includes(k) || pinyinMatch(element, k))
}

export const createBridge = (messagePort?: MessagePort) => {
  let queue = []
  let port: MessagePort | null = messagePort
  const eventBus = new EventEmitter()
  const callbackMap = new Map<string, { resolve: Function, reject: Function }>()
  const handlerMap = new Map<string, (...args: any[]) => any>()

  const init = () => {
    if (!port) return;
    port.addEventListener('message', (event: MessageEvent) => {
      const { type } = event.data
      console.log(event.data)
      if (type === 'invoke') {
        const { methodName, args, callbackName } = event.data
        const handler = handlerMap.get(methodName)
        handler?.({ methodName, args, callbackName })
        return
      }
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
    queue.forEach(item => port.postMessage(item))
    queue = []
  }
  init()
  return {
    setPort(messagePort: MessagePort) {
      if (port) {
        throw new Error('port has already set')
      }
      port = messagePort
      init()
    },
    invoke(methodName: string, ...args: any[]) {
      return new Promise((resolve, reject) => {
        const callbackName = `${methodName}_${Math.random()}`
        callbackMap.set(callbackName, { resolve, reject })
        const item = {
          type: 'invoke',
          methodName,
          args,
          callbackName
        }
        if (port) {
          port.postMessage(item)
        } else {
          queue.push(item)
        }
      })
    },
    handle<F extends (...args: any[]) => any>(methodName: string, callback: F) {
      handlerMap.set(methodName, async (data: { callbackName: string, args: Parameters<F> }) => {
        let result: ReturnType<F> | undefined;
        let error = null;
        try {
          result = await callback(...data.args)
        } catch (err) {
          error = err 
        }
        port?.postMessage({
          type: 'callback',
          callbackName: data.callbackName,
          returnValue: result,
          error
        })
      })
    },
    on: eventBus.on.bind(eventBus),
    once: eventBus.once.bind(eventBus),
    off: eventBus.off.bind(eventBus),
    emit: <D extends any[]>(eventName: string, ...args: D) => {
      port?.postMessage({
        type: 'event',
        eventName,
        args
      })
    }
  }
}

export type PortBridge = ReturnType<typeof createBridge>
