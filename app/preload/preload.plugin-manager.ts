import { ipcRenderer } from 'electron'
import { CommonListItem, PublicPlugin } from "shared/types/plugin";
import * as nodePath from 'path'
import * as fs from 'fs'

interface RunningPublicPlugin {
  plugin: PublicPlugin
  path: string
  pkg: any
}

const plugins: Map<string, RunningPublicPlugin> = new Map();

const checkPluginsRegistered = (path: string) => {
  const resolvedPaths = Array.from(plugins.values()).map((p: any) => require.resolve(p.path))
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
      db: window.publicApp.db,
      getUtils: () => require('../utils/index'),
      setList: (list: CommonListItem[]) => {
        const event = new CustomEvent('plugin:setList', {
          detail: {
            name: pkg.name,
            list,
          }
        })
        window.dispatchEvent(event)
      },
      enter: (item: CommonListItem, args: any) => window.publicApp.enter(pkg.name, item, args),
      exit: () => window.publicApp.exit(pkg.name)
    }) as PublicPlugin
    const pluginInstance = {
      plugin,
      pkg,
      path: pluginPath
    }
    plugins.set(pkg.name, pluginInstance)
    return pluginInstance
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${err.message}`)
  }
}

const removePlugin = (name: string) => {
  plugins.delete(name)
}

const getPlugins = () => plugins

const handleQuery = (keyword: string) => {
  plugins.forEach(plugin => plugin.plugin.onInput?.(keyword))
}

const handleEnter = (plugin: RunningPublicPlugin, args: { item: CommonListItem, index: number, list: CommonListItem[] }) => {
  if (typeof args.item.onEnter === 'function') {
    args.item.onEnter?.(args.item, args.index, args.list)
  } else if (typeof plugin.plugin.onEnter === 'function') {
    plugin.plugin.onEnter?.(args.item, args.index, args.list)
  }
}

let pluginViewPort: MessagePort | null = null

const enterPlugin = (name: string, item: CommonListItem, args: any) => {
  window.dispatchEvent(new CustomEvent('inputBar.enter', { detail: { name, item } }))

  const { port1, port2 } = new MessageChannel()
  return new Promise<MessagePort>(resolve => {
    ipcRenderer.postMessage('enter', { item, args }, [port2])
    port1.addEventListener('message', (event) => {
      if (event.data === 'ready') {
        resolve(port1)
      }
    }, { once: true })
    port1.start()
    pluginViewPort = port1;
  })
}

const exitPlugin = (name: string) => {
  pluginViewPort = null
  return ipcRenderer.invoke('exit')
}

const setSubInputValue = (value: string) => pluginViewPort.postMessage({ type: 'event', eventName: 'inputValueChanged', payload: value })

export { getPlugins, addPlugin, removePlugin, handleQuery, handleEnter, enterPlugin, exitPlugin, setSubInputValue }
