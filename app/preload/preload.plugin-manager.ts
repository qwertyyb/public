import { ipcRenderer } from 'electron'
import * as remote from '@electron/remote'
import { CommonListItem, PublicPlugin } from "shared/types/plugin";
import * as nodePath from 'path'
import * as fs from 'fs'

interface RunningPublicPlugin {
  plugin: PublicPlugin
  path: string
  pkg: any
}

const plugins: RunningPublicPlugin[] = []

const checkPluginsRegistered = (path: string) => {
  const resolvedPaths = plugins.map((p: any) => require.resolve(p.path))
  const targetPath = require.resolve(path);
  return resolvedPaths?.includes(targetPath)
}


const addPlugin = (pluginPath: string): RunningPublicPlugin | undefined => {
  console.log('addPlugin', pluginPath)
  if (checkPluginsRegistered(pluginPath)) {
    throw new Error('插件已注册,请勿重复注册: ' + pluginPath)
  }
  try {
    const createPlugin = require(pluginPath).default || require(pluginPath)
    const pkg = JSON.parse(fs.readFileSync(nodePath.join(nodePath.dirname(require.resolve(pluginPath)), './package.json'), { encoding: 'utf-8' }))
    const plugin = createPlugin({
      getApp: () => remote.getGlobal('coreApp'),
      getMainWindow: () => remote.getGlobal('coreApp').mainWindow,
      db: {
        run: (sql: string, params?: Object) => ipcRenderer.invoke('db.run', sql, params),
        all: (sql: string, params?: Object) => ipcRenderer.invoke('db.all', sql, params),
        get: (sql: string, params?: Object) => ipcRenderer.invoke('db.get', sql, params),
      },
      getUtils: () => require('../utils/index'),
      setList: (list: CommonListItem[]) => {
        const event = new CustomEvent('plugin:setList', {
          detail: {
            plugin,
            list,
          }
        })
        document.dispatchEvent(event)
      },
    }) as PublicPlugin
    const pluginInstance = {
      plugin,
      pkg,
      path: pluginPath
    }
    plugins.push(pluginInstance)
    return pluginInstance
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

const removePlugin = (name: string) => {
  const index = plugins.findIndex(plugin => plugin.pkg.name === name)
  if (index > -1) {
    plugins.splice(index, 1)
  }
}

const getPlugins = () => plugins

const handleQuery = (keyword: string) => {
  console.log('handleQuery', keyword, plugins)
  plugins.forEach(plugin => plugin.plugin.onInput?.(keyword))
}

const handleEnter = (plugin: RunningPublicPlugin, args: { item: CommonListItem, index: number, list: CommonListItem[] }) => {
  if (typeof args.item.onEnter === 'function') {
    args.item.onEnter?.(args.item, args.index, args.list)
  } else if (typeof plugin.plugin.onEnter === 'function') {
    plugin.plugin.onEnter?.(args.item, args.index, args.list)
  }
}

export { getPlugins, addPlugin, removePlugin, handleQuery, handleEnter }
