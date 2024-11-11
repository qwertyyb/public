import { ipcRenderer } from 'electron'
import * as nodePath from 'path'
import * as fs from 'fs'
import * as utils from '../utils'
import { getConfig } from '../config';
import { hanziToPinyin, getFrontmostApplication, getSelectedPath, getCurrentPath } from '@public/osx-utils';

const plugins: Map<string, IRunningPlugin> = new Map()
let pluginsSettings: Record<string, IPluginSettings> = {}

const resultsMap = new WeakMap<IPluginCommand, { score: number, query: string, owner: IRunningPlugin }>()

const calcScore = (query: string, target: string) => {
  if (query && target.includes(query)) {
    return query.length / target.length
  }
  return -1
}

const pinyin = (text: string) => {
  if (/[^\x00-\xff]/.test(text)) {
    const full: string = hanziToPinyin(text)
    if (full) {
      return [
        full.replace(/\s/g, ''),
        full.split(' ').map(i => i.trim()[0]).filter(i => i).join('').toLowerCase()
      ]
    }
  }
  return []
}

const checkCommand = (command: Partial<IPluginCommandConfig>) => {
  const requireFields = ['name', 'title']
  requireFields.forEach(name => {
    if (!command[name]) {
      throw new Error(`${name} is required: ` + JSON.stringify(command))
    }
  })
  if (command.mode === 'listView' && !command.preload) {
    throw new Error('listView mode command need preload property')
  }
  if (command.mode === 'view' && !command.entry) {
    throw new Error('view mode command need entry property')
  }
}

const formatCommand = (command: IPluginCommandConfig, manifest: IPluginManifest): IPluginCommand => {
  checkCommand(command)
  const item = {
    ...command,
    name: command.name,
    title: command.title ?? manifest.title,
    subtitle: command.subtitle ?? manifest.subtitle,
    icon: command.icon ?? manifest.icon,
    mode: command.mode ?? 'none',
    entry: command.entry,
    preload: command.preload
  }
  const keywords: string[] = [item.name, item.title, item.subtitle || '', ...pinyin(item.title), ...pinyin(item.subtitle || '')].filter(Boolean)
  const matches = (command.matches || []).map(match => {
    if (match.type === 'text') {
      const keywords = (match.keywords || []).reduce<string[]>((acc, keyword) => {
        return [...acc, keyword, ...pinyin(keyword)]
      }, [])
      return { ...match, keywords }
    }
    return match
  })
  return {
    ...item,
    matches: [...matches, { type: 'text', keywords } as ITextPluginCommandMatch]
  }
}

const checkPluginsRegistered = (path: string) => {
  return Array.from(plugins.values()).some(item => item.path === path)
}

const checkManifest = (manifest: Partial<IPluginManifestConfig>) => {
  const requireFields = ['name', 'title', 'icon']
  requireFields.forEach(name => {
    if (!manifest[name as keyof IPluginManifestConfig]) {
      throw new Error(`${name} is required: ` + JSON.stringify(manifest))
    }
  })
}

const addPlugin = async (pluginPath: string) => {
  console.log('addPlugin', pluginPath)
  if (checkPluginsRegistered(pluginPath)) {
    console.warn('插件已注册,请勿重复注册: ' + pluginPath)
    return
  }
  try {
    const pkg = JSON.parse(await fs.promises.readFile(nodePath.join(pluginPath, './package.json'), { encoding: 'utf-8' }))
    const publicPlugin = pkg.publicPlugin
    const { commands: _, ...rest } = publicPlugin;
    const entry = rest.entry || pkg.main
    const name = rest.name || pkg.name
    const manifest: IPluginManifest = { name, ...rest, entry }
    checkManifest(manifest)
    const commands: IPluginCommand[] = (publicPlugin.commands || []).map((item: any) => formatCommand(item, manifest))
    const pluginInstance: IRunningPlugin = {
      manifest,
      path: pluginPath,
      commands
    }
    if (entry) {
      const entryPath = nodePath.join(pluginPath, entry)
      const createPlugin = (__non_webpack_require__(entryPath).default || __non_webpack_require__(entryPath)) as IPlugin
      const plugin = createPlugin({
        updateCommands: (commands: IPluginCommandConfig[]) => {
          pluginInstance.commands = commands.map(item => formatCommand(item, manifest))
        },
        showCommands: (commands: IPluginCommandConfig[]) => {
          commands.forEach(command => resultsMap.set(formatCommand(command, manifest), { score: 1, query: '', owner: pluginInstance }))
          window.dispatchEvent(new CustomEvent('plugin:showCommands', { detail: { name: manifest.name, commands }}))
        },
        enter: (command, options) => {
          return window.publicApp?.enter(name, command, options)
        }
      }) as IPluginReturn
      pluginInstance.plugin = plugin
    }
    plugins.set(pkg.name, pluginInstance)
    return pluginInstance
  } catch (err) {
    throw new Error(`引入插件 ${pluginPath} 失败: ${(err as any).message}`)
  }
}

const removePlugin = (name: string) => {
  plugins.delete(name)
}


const handleQuery = (keyword: string) => {
  plugins.forEach(plugin => {
    try {
      const disabled = plugin.settings?.disabled
      !disabled && plugin.plugin?.onInput?.(keyword)
    } catch (err) {
      console.error(err)
    }
  })
  let results: IPluginCommand[] = []
  plugins.forEach((plugin, name) => {
    const pluginSettings = pluginsSettings[name]
    console.log(name, pluginSettings, pluginSettings?.disabled)
    if (pluginSettings?.disabled) {
      return
    }

    const { commands = [] } = plugins.get(name)!
    commands.forEach(command => {
      const { matches } = command
      const settings = pluginSettings?.commands?.[command.name]
      const disabled = settings?.disabled
      if (disabled) return;
      const alias = settings?.alias
      if (alias && alias.includes(keyword)) {
        const result = { ...command }
        const score = 10 + calcScore(keyword, alias)
        results.push(result)
        resultsMap.set(result, { query: keyword, score, owner: plugin })
        return
      }

      const triggerMatch = matches.find(match => match.type === 'trigger') as ITriggerPluginCommandMatch | undefined
      if (triggerMatch) {
        const triggerIndex = triggerMatch.triggers.findIndex(trigger => keyword.startsWith(trigger + ' '))
        if (triggerIndex >= 0) {
          const query = keyword.substring(triggerMatch.triggers[triggerIndex].length + 1)
          const result = {
            ...command,
            title: (query && triggerMatch.title) ? triggerMatch.title.replaceAll('$query', query) : command.title,
            subtitle: (query && triggerMatch.subtitle) ? triggerMatch.subtitle.replaceAll('$query', query) : command.subtitle
          }
          results.push(result)
          resultsMap.set(result, { query, score: 1, owner: plugin })
          return
        }
      }
      let score = -1
      matches.forEach((match: IPluginCommandMatch) => {
        if (match.type === 'text') {
          score = Math.max(score, ...match.keywords.map(word => calcScore(keyword, word)))
        }
      })
      if (score > 0) {
        const result = { ...command }
        results.push(result)
        resultsMap.set(result, { query: '', score, owner: plugin })
        return
      }
      const fullMatch = matches.find(item => item.type === 'full') as IFullPluginCommandMatch | undefined
      if (fullMatch) {
        const result = {
          ...command,
          title: (keyword && fullMatch.title) ? fullMatch.title.replaceAll('$query', keyword) : command.title,
          subtitle: (keyword && fullMatch.subtitle) ? fullMatch.subtitle.replaceAll('$query', keyword) : command.subtitle
        }
        results.push(result)
        resultsMap.set(result, { query: keyword, score: 0.0001, owner: plugin })
      }
    })
  })
  return results.sort((prev, next) => resultsMap.get(next)!.score - resultsMap.get(prev)!.score)
}

const handleSelect = (command: IPluginCommand, keyword: string) => {
  const rp = resultsMap.get(command)
  return rp?.owner.plugin?.onSelect?.(command, rp.query)
}

const enterPluginCommand = (owner: IRunningPlugin, command: IPluginCommand, options?: { query: string }) => {
  const query = options?.query || ''
  if (command.mode === 'none') {
    owner.plugin?.onEnter?.(command, query)
  } else if (command.mode === 'listView') {
    // js entry
    window.publicApp.enter(owner.manifest.name, command, {
      entry: getConfig().rendererEntry + '#/plugin/list-view',
      preload: nodePath.join(owner.path, command.preload!),
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
    }, query)
  } else if (command.mode === 'view') {
    // html entry
    window.publicApp.enter(owner.manifest.name, command, {
      entry: nodePath.join(owner.path, command.entry!),
      preload: command.preload ? nodePath.join(owner.path, command.preload) : undefined,
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
    }, query)
  }
}

const handleEnter = (command: IPluginCommand) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  enterPluginCommand(rp.owner, command, { query: rp.query })
}

const handleAction = (command: IPluginCommand, action: any, keyword: string) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  rp.owner.plugin?.onAction?.(command, action, keyword)
}

const updatePluginsSettings = (value: IPluginsSettings) => {
  // @ts-ignore
  pluginsSettings = value
}

const getPlugins = () => plugins

const PluginManager = {
  getPlugins,
  addPlugin,
  removePlugin,

  handleQuery,
  handleSelect,
  handleEnter,
  handleAction,

  enterPluginCommand,

  updatePluginsSettings
}

export type IPluginManager = typeof PluginManager

export default PluginManager

window.addEventListener('publicApp.mainWindow.show', () => {
  console.log('mainWindowShow', getFrontmostApplication())
})

// @ts-ignore
window.getFrontmostApplication = getFrontmostApplication
// @ts-ignore
window.getSelectedPath = getSelectedPath
// @ts-ignore
window.getCurrentPath = getCurrentPath
