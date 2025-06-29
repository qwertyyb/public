import PouchDB from 'pouchdb'

export const db = new PouchDB('data/publicApp')

export const pushView = (options: { path: string, params?: any }) => {
  return window.dispatchEvent(new CustomEvent('push-view', { detail: { ...options }}))
}

export const popView = (options: { count: number } = { count: 1}) => {
  return window.dispatchEvent(new CustomEvent('pop-view', { detail: { ...options }}))
}

export const popToRoot = (options?: { clearInput?: boolean }) => {
  return window.dispatchEvent(new CustomEvent('pop-to-root', { detail: { ...options } }))
}

export const openPluginPreferences = (plugin: string, options?: { wait?: boolean }) => {
  if (!options?.wait) {
    return pushView({ path: '/plugin/prfs', params: { plugin } })
  }
  return new Promise<void>(resolve => {
    pushView({ path: '/plugin/prfs', params: { plugin, done: resolve } })
  })
}

export const openCommandPreferences = (plugin: string, command: string, options?: { wait?: boolean }) => {
  if (!options?.wait) {
    return pushView({ path: '/plugin/prfs', params: { plugin, command } })
  }
  return new Promise<void>(resolve => {
    pushView({ path: '/plugin/prfs', params: { plugin, command, done: resolve } })
  })
}
