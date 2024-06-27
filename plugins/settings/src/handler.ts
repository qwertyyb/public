import { queryRecord, updateRecord, insertRecord, createDatabase } from './storage'
import * as path from 'path'

const getDefaultSettings = () => {
  const getDefaultPluginPaths = () => {
    const paths = [
      path.resolve(__dirname, '../../launcher'),
      path.resolve(__dirname, '../../command'),
      path.resolve(__dirname, '../../calculator'),
      path.resolve(__dirname, '../../qrcode'),
      path.resolve(__dirname, '../../search'),
      path.resolve(__dirname, '../../translate'),
      path.resolve(__dirname, '../../clipboard'),
      path.resolve(__dirname, '../../douban'),
      path.resolve(__dirname, '../../magic'),
      path.resolve(__dirname, '../../ai-chat'),
      // path.resolve(__dirname, '../../terminal'),
      // path.resolve(__dirname, '../../favorite'),
      path.resolve(__dirname, '../../find')
    ]
    console.log('default plugins', paths)
    return paths.map(pathstr => ({ path: pathstr }))
  }

  return {
    launchAtLogin: true,
    shortcut: 'CommandOrControl+Space',
    shortcuts: [
      { keyword: 'cp ', shortcut: 'Command+Shift+V' }
    ],
    plugins: getDefaultPluginPaths()
  }
}

const registerShortcuts = (settings: any) => {
  const { shortcut, shortcuts } = settings;
  const list = [
    { shortcut, keyword: '' },
    ...shortcuts
  ]
  const remote = require('@electron/remote')
  const globalShortcut = remote.globalShortcut
  globalShortcut.unregisterAll()
  list.forEach(({ keyword, shortcut, temp }) => {
    shortcut && !temp && globalShortcut.register(shortcut, () => {
      window.publicApp.mainWindow.show()
      window.publicApp.inputBar.setValue(keyword)
    })
  })
}

const registerLaunchAtLogin =(settings: any) => {
  // 启动项
  require('@electron/remote').app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin
  })
}

const getSettings = async () => {
  // let value = await createDatabase().then(() => queryRecord({ key: 'config' })).then(res => res?.value)
  // if (!value) {
    const value = getDefaultSettings()
    // updateRecord({ key: 'config', value })
  // }
  return value
}

const updateSettings = async (settings: any) => {
  return updateRecord({ key: 'config', value: settings })
}

const initPlugins = async (settings: any) => {
  const plugins = settings.plugins || []
  console.log(settings)
  return plugins.map((p: any) => {
    try {
      window.PluginManager.addPlugin(p.path)
    } catch(err) {
      console.warn(err);
    }
  })
}

const initSettings = async () => {
  console.log('initSettings')
  const settings = await getSettings()
  registerLaunchAtLogin(settings)
  registerShortcuts(settings)

  initPlugins(settings)
}

const updatePluginsSettings = async () => {
  const pluginConfigs = JSON.parse(JSON.stringify(window.PluginManager.getPlugins()))
  const settings = await getSettings();

  settings.plugins = pluginConfigs

  return updateSettings(settings)
}

const handlers = {
  async registerShortcuts(args) {
    await updateSettings(args.settings)
    registerShortcuts(args.shortcuts)
  },
  async registerLaunchAtLogin(args) {
    await updateSettings(args.settings)
    registerLaunchAtLogin(args.settings)
  },
  async removePlugin(args) {
    window.PluginManager.removePlugin(args.name);
    await updatePluginsSettings()
  },
  async registerPlugin(args) {
    window.PluginManager.addPlugin(args.path)
    await updatePluginsSettings()
  },
  getPlugins() {
    return JSON.parse(JSON.stringify(Array.from(window.PluginManager.getPlugins().values())))
  },
  getSettings() {
    return getSettings()
  },
}

const initHandler = (port: MessagePort) => {
  port.addEventListener('message', async (event: MessageEvent<{
    type: string,
    methodName: string,
    args: any,
    callbackName: string
  }>) => {
    const { type, methodName, args, callbackName } = event.data
    if (type !== 'method') return
    try {
      const returnValue = await handlers[methodName]?.(args)
      port?.postMessage({
        type: 'callback',
        callbackName,
        returnValue,
        error: null,
      })
    } catch (err) {
      port?.postMessage({
        type: 'callback',
        callbackName,
        err,
      })
      throw err;
    }
  })
}

export { initHandler, initSettings }
