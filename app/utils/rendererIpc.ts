import { ipcRenderer } from 'electron'

const generateCallbackName = (channel: string) => {
  const ramdomStr = Math.random().toString(36).slice(2,8)
  return channel + '_' + ramdomStr
}

const rendererIpc = {
  invoke: (webContentsId: number, channel: string, args: any = {}) => {
    return new Promise((resolve, reject) => {
      const callbackName = generateCallbackName(channel)
      const listener = (event: Electron.IpcRendererEvent, result: any) => {
        ipcRenderer.off(callbackName, listener)
        if (typeof result?.error === 'string') {
          reject(new Error(result.error))
        } else {
          resolve(result);
        }
      }
      ipcRenderer.on(callbackName, listener)
      setTimeout(() => {
        // 设置调用超时时间
        ipcRenderer.off(callbackName, listener)
        const error = new Error(`call ${channel} timeout, args: ${JSON.stringify(args)}`)
        reject(error)
      }, 1500)
      args.__callbackName = callbackName
      ipcRenderer.sendTo(webContentsId, channel, args)
    })
  },
  handle: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => any) => {
    ipcRenderer.on(channel, async (event, args) => {
      const { __callbackName: cbName, ...rest } = args
      const result = await Promise.resolve(listener(event, args));
      event.sender.sendTo(event.senderId, cbName, result)
    })
  }
}

export default rendererIpc