import PouchDB from 'pouchdb'

export const db = new PouchDB('data/publicApp')

export const openPluginPreferences = (plugin: string) => {
  return new Promise<void>(resolve => {
    window.dispatchEvent(new CustomEvent('push-view', { detail: { path: '/plugin/prfs', params: { plugin, done: resolve } } }))
  })
}

export const openCommandPreferences = (plugin: string, command: string) => {
  return new Promise<void>(resolve => {
    window.dispatchEvent(new CustomEvent('push-view', { detail: { path: '/plugin/prfs', params: { plugin, command, done: resolve } } }))
  })
}
