import { queryRecord, updateRecord, insertRecord, createDatabase } from './storage'
const path = require('path')

const getDefaultSettings = () => {
  const getDefaultPluginPaths = () => {
    const paths = [
      path.resolve(__dirname, '../launcher/index.js'),
      path.resolve(__dirname, '../command/index'),
      path.resolve(__dirname, '../calculator'),
      path.resolve(__dirname, '../qrcode'),
      path.resolve(__dirname, '../search/index'),
      path.resolve(__dirname, '../translate/index'),
      path.resolve(__dirname, '../clipboard/index'),
      path.resolve(__dirname, '../terminal/index')
    ].map(pathstr => ({ path: require.resolve(pathstr) }))

    return paths
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
      window.publicApp.getMainWindow().show()
      // @ts-ignore
      keyword && window.setQuery && window.setQuery(keyword)
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
  let value = await createDatabase().then(() => queryRecord({ key: 'config' })).then(res => res?.value)
  if (!value) {
    value = getDefaultSettings()
    insertRecord({ key: 'config', value })
  }
  return value
}

const updateSettings = async (settings: any) => {
  return updateRecord({ key: 'config', value: settings })
}

const initPlugins = async (settings: any) => {
  const plugins = settings.plugins || []
  return plugins.map((p: any) => {
    try {
      window.PluginManager.registerPlugin(p)
    } catch(err) {
      console.warn(err);
    }
  })
}

const initSettings = async () => {
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

const initHandler = () => {
  const { handle } = window.rendererIpc
  handle('registerShortcuts', async (e, args) => {
    await updateSettings(args.settings)
    registerShortcuts(args.settings)
  })

  handle('registerLaunchAtLogin', async (e, args) => {
    await updateSettings(args.settings)
    registerLaunchAtLogin(args.settings)
  })

  handle('getSettings', async() => {
    return getSettings();
  })

  handle('getPlugins', () => {
    return JSON.parse(JSON.stringify(window.PluginManager.getPlugins()))
  })

  handle('removePlugin', async (e, { index }) => {
    window.PluginManager.removePlugin(index);
    await updatePluginsSettings()
  })
  
  handle('registerPlugin', async (e, { path }) => {
    try {
      window.PluginManager.registerPlugin({ path })
      await updatePluginsSettings()
    } catch (err) {
      console.warn(err)
      return { error: err.message}
    }
  })
}

export { initHandler, initSettings }
