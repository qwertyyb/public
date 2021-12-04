import { readFileSync } from "fs";
import { CommonListItem, MessageData, PublicPluginConfig } from "src/shared/types/plugin"
import { ipcRenderer } from "electron";
import * as path from 'path';

interface RunningPlugin{
  worker: Worker,
  path: string,
  config: PublicPluginConfig
}

const plugins: Map<string, RunningPlugin> = new Map()

const callbackHandler = (handler: Function) => async (e: MessageEvent<MessageData>) => {
  console.log('[main]', e)
  let result = undefined
  try {
    const value = await handler(e)
    result = { value, type: 'resolve' }
  } catch (err) {
    result = { type: 'reject', value: err.message }
  }
  (e.target as Worker).postMessage({
    channel: 'message:callback',
    args: {
      callbackName: e.data.callbackName,
      ...result
    }
  })
}

const registerPlugin = (pluginConfigPath: string): Worker => {
  // @todo 错误处理
  const configDirPath = path.dirname(pluginConfigPath)
  const config = JSON.parse(readFileSync(pluginConfigPath, { encoding: 'utf-8' } ))
  const { preload, main } = config
  const mainPath = main ? 'file://' + path.join(configDirPath, main) : null;
  const preloadPath = path.join(configDirPath, preload)
  const runtimePath = path.join(__dirname, 'plugin.js')
  console.log(runtimePath)
  try {
    const worker = new Worker('file://' + runtimePath + `?plugin=1&pluginPath=${encodeURIComponent(preloadPath)}`)
    // worker.onmessage = e => console.log(e)
    // console.log(worker, preloadPath)

    // const webview = document.createElement('webview')
    // webview.setAttribute('src', `${mainPath || 'http://localhost:5000'}?plugin=1&pluginPath=${encodeURIComponent(preloadPath)}`)
    // webview.preload = 'file://' + path.resolve(__dirname, './plugin.js')
    // webview.disablewebsecurity = true

    worker.addEventListener('message', callbackHandler(async (e: MessageEvent<MessageData>) => {
      const { channel, args } = e.data
      if (channel === 'plugin:setList') {
        const [list] = args
        const resultList = Array.isArray(list) ? list : []
        const event = new CustomEvent('plugin:setList', {
          detail: {
            pluginPath: pluginConfigPath,
            list: resultList,
          }
        })
        document.dispatchEvent(event)
      } else if(channel === 'plugin:enterPlugin') {
        // webview.classList.add('show')
      } else if (channel.startsWith('plugin:storage')) {
        const name = channel.split(':').pop()
        const [originalKey, value] = args
        // @todo 应该有一个插件ID
        const key = 'settings' + '-' + (originalKey || '')
        return ipcRenderer.invoke('storage.' + name, key, value)
      } else if (channel.startsWith('plugin:pluginManager')) {
        // @todo 白名单可调
        const name = channel.split(':').pop()
        switch(name) {
          case 'register':
            window.PluginManager.registerPlugin(args[0])
            break;
          case 'getList':
            const plugins = window.PluginManager.getPlugins()
            return plugins
          case 'remove':
            window.PluginManager.removePlugin(args[0])
            return;
        }
      } else if (channel === 'plugin:enableLaunchAtLogin') {
        ipcRenderer.invoke('enableLaunchAtLogin', args[0])
      } else if (channel === 'plugin:registerShortcuts') {
        ipcRenderer.invoke('registerShortcuts', args[0])
      }
    }))
    // document.body.appendChild(webview)
    plugins.set(pluginConfigPath, {
      config,
      worker,
      path: pluginConfigPath
    })
    return worker
  } catch (err) {
    throw new Error(`引入插件 ${pluginConfigPath} 失败: ${err.message}`)
  }
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

  handleQuery(
    keyword: string
  ) {
    console.log('handle query')
    plugins.forEach(plugin => 
      plugin.worker.postMessage({
        channel: 'onInput',
        args: { keyword }
      })
    );
  },
  handleEnter(
    pluginPath: string,
    args: {
      item: CommonListItem,
      index: number,
      list: CommonListItem[]
    }
  ) {
    const targetPlugin = plugins.get(pluginPath)
    if (!targetPlugin) return;
    targetPlugin.worker.postMessage({
      channel: 'onEnter', 
      args: { item: args.item }
    })
  },
}