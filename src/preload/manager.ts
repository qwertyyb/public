import { readFileSync } from "fs";
import { MessageData, PublicPluginConfig } from "src/shared/types/plugin"
import { IpcMessageEvent, ipcRenderer } from "electron";
import * as path from 'path';
import { match } from './utils'

const plugins: Map<string, RunningPlugin> = new Map()
const commandList: RunningCommand[] = [];

const isLocalPath = (filePath: string) => !/^(http:|https:)?\/\//.test(filePath)

const transformPath = (curPath: string, filePath: string, useProtocol = true) => {
  if (!isLocalPath(filePath)) return filePath;
  console.log('aaa', curPath, filePath)
  return (useProtocol ? 'file://' : '') + path.join(curPath, filePath)
}

const processPath = (config: Config, configPath: string) => {
  const { icon, preload, entry, commands = [] } = config;
  const configDirPath = path.dirname(configPath)
  const iconPath = transformPath(configDirPath, icon, true)
  const preloadPath = preload ? transformPath(configDirPath, preload, false) : null
  const entryPath = entry ? transformPath(configDirPath, entry, false) : null
  const concatPathCommands = commands.map(command => {
    const { icon, entry } = command
    return {
      ...command,
      icon: icon ? transformPath(configDirPath, icon, true) : iconPath,
      entry: entry ? transformPath(configDirPath, entry, false) : entryPath,
    }
  })
  return {
    ...config,
    icon: iconPath,
    preload: preloadPath,
    entry: entryPath,
    commands: concatPathCommands
  }
}

const simulateApi = new Proxy({}, {
  get: (target, prop, receiver) => {
    console.log('aaaa')
    return (...args) => ipcRenderer.invoke('simulate', prop, ...args)
  }
})

const getApi = (plugin: RunningPlugin) => {
  return {
    app: {
      enableLaunchAtLogin(enable) {
        ipcRenderer.invoke('enableLaunchAtLogin', enable)
      },
      registerShortcuts(settings) {
        ipcRenderer.invoke('registerShortcuts', settings)
      },
      hide() {
        ipcRenderer.invoke('app.hide')
      }
    },
    simulate: simulateApi,
    pluginManager: {
      register: (configPath: string) => {
        const { worker, handler, ...rest } = window.PluginManager.registerPlugin(configPath);
        return rest
      },
      getList: () => window.PluginManager.getPlugins(),
      remove: (name) => window.PluginManager.removePlugin(name)
    },
    storage: {
      setItem: (key: string, val: string) => ipcRenderer.invoke('storage.setItem', `${plugin.config.name}-${key}`, val),
      getItem: (key: string) => ipcRenderer.invoke('storage.getItem', `${plugin.config.name}-${key}`),
      removeItem: (key: string) => ipcRenderer.invoke('storage.removeItem', `${plugin.config.name}-${key}`),
      clear: () => ipcRenderer.invoke('storage.clear')
    },
    db: {
      run: (sql, params) => ipcRenderer.invoke('db.run', sql, params),
      all: (sql, params) => ipcRenderer.invoke('db.all', sql, params),
      get: (sql, params) => ipcRenderer.invoke('db.get', sql, params),
    },
    plugin: {
      setList: (commandList: Command[]) => {
        const list: RunningCommand[] = commandList.map(command => ({
          plugin,
          command,
        }))
        const event = new CustomEvent('plugin:setList', {
          detail: {
            append: true,
            resultList: list,
          }
        })
        document.dispatchEvent(event);
      },
      exit: () => window.PluginManager.exitPlugin(plugin.config.name)
    }
  }
}

const parseEvent = (e: MessageEvent<MessageData> | IpcMessageEvent) => {
  let { channel, args } = e as IpcMessageEvent
  if (channel) {
    const callbackName = args.pop()
    return { channel, args, callbackName }
  }
  channel = (e as MessageEvent<MessageData>).data.channel
  args = (e as MessageEvent<MessageData>).data.args
  const callbackName = (e as MessageEvent<MessageData>).data.callbackName

  return { channel, args, callbackName }
}

const callbackHandler = (api: Object) => async (e: MessageEvent<MessageData>) => {
  console.log('[main]', e)
  const { channel, args, callbackName } = parseEvent(e)
  const props = channel.split('.')
  const handler = props.reduce((obj, prop) => obj?.[prop], api)
  let result = undefined
  try {
    const value = await handler(...args)
    result = { value, type: 'resolve' }
  } catch (err) {
    console.error(err)
    result = { type: 'reject', value: err.message }
  }
  (e.target as Worker).postMessage?.({
    channel: 'message:callback',
    args: {
      callbackName,
      ...result
    }
  });
  console.log(result);
  (e.target as Electron.WebviewTag).send?.('message:callback', {
    callbackName,
    ...result
  })
}

const launch = (config: Config): Worker => {
  try {
    const { preload, name } = config
    const runtimePath = path.join(__dirname, 'plugin.js')
    const worker = new Worker('file://' + runtimePath + `?plugin=1&pluginPath=${encodeURIComponent(preload)}`)
    return worker
  } catch (err) {
    throw new Error(`引入插件失败: ${err.message}`)
  }
}

const registerPlugin = (configPath: string) => {
  const config = processPath(
    JSON.parse(readFileSync(configPath, { encoding: 'utf-8' } )),
    configPath
  )

  const { name, preload, commands } = config
  let worker = null

  if (preload) {
    worker = launch(config)
  }

  const plugin: RunningPlugin = {
      config,
      worker,
      path: configPath,
      handler: null
  }
  const handler = callbackHandler(getApi(plugin));
  if (worker) {
    worker.addEventListener('message', handler)
  }

  plugin.handler = handler

  const pluginCommandList = commands.map(command => {
    return {
      name,
      config,
      command,
      plugin,
    }
  })
  commandList.push(...pluginCommandList)
  plugins.set(name, plugin)
  return plugins.get(name)
}

const getBasicPath = (): string[] => {
  return [
    // __non_webpack_require__.resolve(path.resolve(__dirname, '../plugins/launcher/index.js')),
    // __non_webpack_require__.resolve(path.resolve(__dirname, '../plugins/clipboard/index.js')),
    // __non_webpack_require__.resolve(path.resolve(__dirname, '../plugins/calculator/index.js')),
    path.resolve(__dirname, '../plugins/settings/plugin.json'),
  ]
}

const checkPluginsRegistered = (pluginConfigPath: string) => {
  return !!plugins.get(pluginConfigPath)
}


window.onload = () => {
  getBasicPath().map(path => registerPlugin(path))
}

window.PluginManager = {
  getPlugins() {
    return Array.from(plugins.values()).map(({ config, path }) => ({ ...config, path }))
  },
  getPlugin(name: string) {
    return plugins.get(name)
  },
  removePlugin(pluginPath: string) {
    plugins.delete(pluginPath)
  },
  registerPlugin(path: string) {
    if(checkPluginsRegistered(path)) {
      throw new Error('插件已注册,请勿重复注册: ' + path)
    }
    const plugin = registerPlugin(path)
    return plugin
  },
  handleQuery(keyword: string) {
    console.log(plugins)
    plugins.forEach((runningPlugin) => {
      if (!runningPlugin.worker) return;
      runningPlugin.worker.postMessage({
        channel: 'onInput',
        args: { keyword }
      })
    })
    const resultList = commandList.filter(item => {
      const { command } = item
      const { name, title } = command
      const candidateList = [name, title]
      return match(candidateList, keyword)
    })
    const event = new CustomEvent('plugin:setList', {
      detail: {
        resultList: resultList,
      }
    })
    document.dispatchEvent(event)
  },
  handleEnter(name: string, result: RunningCommand) {
    const targetPlugin = plugins.get(result.plugin.config.name)
    if (!targetPlugin) return;

    if (result.command.mode === 'no-view') {
      return targetPlugin.worker.postMessage({
        channel: 'onEnter', 
        args: { item: result.command }
      })
    }

    const entry = 'file://' + result.command.entry;
    document.dispatchEvent(new CustomEvent('plugin:enter', {
      detail: {
        plugin: result.plugin.config,
        command: { ...result.command, entry },
        preload: transformPath(__dirname, './plugin.js', true),
      }
    }))
  },
  exitPlugin(name: string) {
    document.dispatchEvent(new CustomEvent('plugin:exit'))
  }
}