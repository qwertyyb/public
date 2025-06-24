export const withCache = <F extends (...args: any[]) => any>(fn: F) => {
  let results = new Map<string, any>()
  return (...args: Parameters<F>): ReturnType<F> => {
    const key = JSON.stringify(args)
    const value = results.get(key)
    if (value) return value;
    const result = fn(...args)
    results.set(key, result)
    return result
  }
}

export const getFrontmostApplication = () => {
}


type TPayload = {
  type: 'invoke',
  method: string,
  callback: string,
  args: any[]
} | {
  type: 'callback',
  callback: string,
  error?: Error,
  returnValue?: Error,
}

type Callback = (payload: TPayload) => void

export const createBridge = (
  send: Callback,
  on: (callback: Callback) => void,
) => {
  const callbacks = new Map<string, { resolve: (result: any) => void, reject: (err: Error) => void }>();
  const functions = new Map<string, (...args: any[]) => any>()

  on(async (data: TPayload) => {
    if (data.type === 'invoke') {
      const { method, args, callback } = data;
      const func = functions.get(method)
      if (func) {
        return send({
          type: 'callback',
          callback,
          returnValue: await func(...args)
        })
      }
      return send({
        type: 'callback',
        callback,
        error: new Error(`method ${method} is not exits`)
      })
    } else if (data.type === 'callback') {
      const { callback, returnValue, error } = data
      const cb = callbacks.get(callback);
      if (error) {
        cb?.reject(error)
      } else {
        cb?.resolve(returnValue);
      }
      callbacks.delete(callback);
    }
  })

  return {
    invoke <R>(method: string, ...args: unknown[]) {
      return new Promise<R>((resolve, reject) => {
        const callback = `callback_${Math.random()}`;
        callbacks.set(callback, { resolve, reject });
        try {
          send({
            type: 'invoke',
            callback,
            method,
            args
          })
        } catch (err) {
          reject(err)
          callbacks.delete(callback)
          throw err
        }
      })
    },
    handle(channel: string, callback: (...args: any[]) => any) {
      functions.set(channel, callback)
    },
    unhandle(channel: string) {
      functions.delete(channel)
    },
  }
}
