import { ipcRenderer } from "electron"

export const setItem = async (key: string, value: any) => {
  return ipcRenderer.invoke("storage.setItem", key, value)
}

export const getItem = <T extends any>(key: string) => {
  return ipcRenderer.invoke("storage.getItem", key) as Promise<T | undefined>
}

export const removeItem = async (key: string) => {
  return ipcRenderer.invoke("storage.removeItem", key)
}