import { IPlugin } from '@public/shared'
import { initSettings, initHandler } from './handler'

const settingsPlugin: IPlugin = (utils) => {

  window.requestIdleCallback(() => {
    initSettings()
  })

  return {
    onEnter: async (item) => {
      const url = new URL(location.href)
      url.hash = '#/settings'
      console.log('ssss')
      const webview = await window.publicApp.createView({
        src: url.href,
        webpreferences: 'nodeIntegration=no,contextIsolation=no,enableRemoteModule=no,allowRunningInsecureContent=no,spellcheck=no,backgroundThrottling=no,sandbox=no'
        // webPreferences: {
        //   nodeIntegration: true,
        //   webSecurity: false,
        //   allowRunningInsecureContent: false,
        //   spellcheck: false,
        //   devTools: true,
        //   contextIsolation: false,
        //   backgroundThrottling: false,
        //   enablePreferredSizeMode: true,
        //   sandbox: false,
        // }
      })
      console.log(webview)
      initHandler(webview)
    }
  }
}

export default settingsPlugin
