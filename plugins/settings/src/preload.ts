import { IPlugin } from '@public/shared'
import { initSettings, initHandler } from './lib/handler'

const settingsPlugin: IPlugin = (utils) => {

  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item) => {
      const url = new URL(location.href)
      url.hash = '#/settings'
      const { bridge } = await window.publicApp.createView('settings', {
        src: url.href,
        webpreferences: 'nodeIntegration=no,contextIsolation=no,enableRemoteModule=no,allowRunningInsecureContent=no,spellcheck=no,backgroundThrottling=no,sandbox=no'
      })
      initHandler(bridge)
    }
  }
}

export default settingsPlugin
