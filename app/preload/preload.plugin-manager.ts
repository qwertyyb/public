import { ipcRenderer } from 'electron'
import type { CommonListItem, PluginCommand, PluginCommandMatch, PluginManifest, PublicPlugin, TextPluginCommandMatch, TriggerPluginCommandMatch } from "shared/types/plugin";
import * as nodePath from 'path'
import * as fs from 'fs'
import * as utils from '../utils'
import { getConfig } from '../config';

interface RunningPublicPlugin {
  plugin: PublicPlugin
  path: string
  pkg: any,
  manifest: Omit<PluginManifest, 'commands'>,
  commands: PluginCommand[]
}

const formatCommand = (command: PluginCommand, manifest: PluginManifest) => {
  const item = {
    ...command,
    name: command.name,
    title: command.title ?? manifest.title,
    subtitle: command.subtitle ?? manifest.subtitle,
    icon: command.icon ?? manifest.icon,
    mode: command.mode ?? 'none',
    entry: command.entry
  }
  const keywords: string[] = [item.name, item.title, item.subtitle]
  return {
    ...item,
    matches: [...(command.matches || []), { type: 'text', keywords } as TextPluginCommandMatch]
  }
}

const plugins: Map<string, RunningPublicPlugin> = new Map();

const checkPluginsRegistered = (path: string) => {
  const resolvedPaths = Array.from(plugins.values()).map((p: any) => __non_webpack_require__.resolve(p.path))
  const targetPath = __non_webpack_require__.resolve(path);
  return resolvedPaths?.includes(targetPath)
}


const addPlugin = async (pluginPath: string) => {
  console.log('addPlugin', pluginPath)
  if (checkPluginsRegistered(pluginPath)) {
    throw new Error('插件已注册,请勿重复注册: ' + pluginPath)
  }
  try {
    const pkg = JSON.parse(await fs.promises.readFile(nodePath.join(pluginPath, './package.json'), { encoding: 'utf-8' }))
    const { commands: _, ...rest } = pkg.publicPlugin;
    const manifest: PluginManifest = {
      name: pkg.name,
      ...rest
    }
    const commands: PluginCommand[] = (pkg.publicPlugin.commands || []).map(item => formatCommand(item, manifest))
    const createPlugin = __non_webpack_require__(pluginPath).default || __non_webpack_require__(pluginPath)
    const plugin = createPlugin({
      db: window.publicApp.db,
      getUtils: () => utils,
      setList: (list: CommonListItem[]) => {
      },
      enter: (item: CommonListItem, args: any) => window.publicApp.enter(pkg.name, item, args),
      exit: () => window.publicApp.exit(pkg.name),
      updateCommands: (commands: PluginCommand[]) => {
        pluginInstance.commands = commands.map(item => formatCommand(item, manifest))
      },
      showCommands: (commands: PluginCommand[]) => {
        commands.forEach(command => resultsMap.set(command, pluginInstance))
        window.dispatchEvent(new CustomEvent('plugin:showCommands', { detail: { name: manifest.name, commands }}))
      }
    }) as PublicPlugin
    const pluginInstance = {
      plugin,
      pkg,
      path: pluginPath,
      manifest,
      commands
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

const resultsMap = new WeakMap<PluginCommand, RunningPublicPlugin>()

const handleQuery = (keyword: string) => {
  plugins.forEach(plugin => plugin.plugin.onInput?.(keyword))
  let results: PluginCommand[] = []
  plugins.forEach((plugin, name) => {
    const { commands = [] } = plugins.get(name)
    commands.forEach(command => {
      const { matches } = command
      const triggerMatch = matches.find(match => match.type === 'trigger') as TriggerPluginCommandMatch | null
      console.log(triggerMatch, keyword)
      if (triggerMatch) {
        const triggerIndex = triggerMatch.triggers.findIndex(trigger => keyword.startsWith(trigger + ' '))
        if (triggerIndex >= 0) {
          const query = keyword.substring(triggerMatch.triggers[triggerIndex].length + 1)
          const result = {
            ...command,
            title: (query && triggerMatch.title) ? triggerMatch.title.replace('$query', query) : command.title,
          }
          results.push(result)
          resultsMap.set(result, plugin)
          return
        }
      }
      const matched = matches.some((match: PluginCommandMatch) => {
        if (match.type === 'text') {
          return match.keywords.some(word => word.toLocaleLowerCase().includes(keyword))
        }
        return false
      })
      if (matched) {
        const result = { ...command }
        results.push(result)
        resultsMap.set(result, plugin)
      }
    })
  })
  return results
}

const handleSelect = (command: PluginCommand, keyword: string) => {
  const rp = resultsMap.get(command)
  return rp?.plugin?.onSelect?.(command, keyword)
}


const handleEnter = (command: PluginCommand) => {
  const rp = resultsMap.get(command)
  if (command.mode === 'none') {
    rp?.plugin.onEnter(command, '')
  } else if (command.mode === 'listView') {
    // js entry
    enterPlugin(rp.manifest.name, command, {
      entry: getConfig().rendererEntry + '#/plugin/list-view',
      webPreferences: {
        preload: nodePath.join(rp.path, command.entry),
        nodeIntegration: true,
        webSecurity: false,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: true,
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        sandbox: false,
      }
    })
  } else if (command.mode === 'view') {
    // html entry
    enterPlugin(rp.manifest.name, command, {
      entry: nodePath.join(rp.path, command.entry),
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false,
        allowRunningInsecureContent: false,
        spellcheck: false,
        devTools: true,
        contextIsolation: false,
        backgroundThrottling: false,
        enablePreferredSizeMode: true,
        sandbox: false,
      }
    })
  }
}

let pluginViewPort: MessagePort | null = null

const enterPlugin = (name: string, item: PluginCommand, args: any) => {
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

export {
  getPlugins,
  addPlugin,
  removePlugin,
  handleQuery,
  handleSelect,
  handleEnter,
  enterPlugin,
  exitPlugin,
  setSubInputValue,
}

