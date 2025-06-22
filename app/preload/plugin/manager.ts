import * as nodePath from 'path'
import * as fs from 'fs'
import { IActionItem, IFullPluginCommandMatch, IPlugin, IPluginCommand, IPluginCommandConfig, IPluginCommandMatch, IPluginManager, IPluginManifest, IPluginManifestConfig, IPluginReturn, IPluginSettings, IPluginsSettings, IRunningPlugin, ITextPluginCommandMatch, ITriggerPluginCommandMatch } from '@public/shared'
import { hanziToPinyin, getFrontmostApplication } from '@public/osx-utils';
import { getSettings } from './settings';

const plugins: Map<string, IRunningPlugin> = new Map()
let pluginsSettings: IPluginsSettings = {}

const resultsMap = new WeakMap<IPluginCommand, { score: number, query: string, owner: IRunningPlugin }>()

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

const joinPath = (relativePath: string, path: string) => {
  if (!relativePath) return relativePath
  if (/^\w+:\/\//.test(relativePath)) {
    return relativePath
  }
  return 'ipublic://public.qwertyyb.com/local-file?path=' + encodeURIComponent(nodePath.join(path, relativePath))
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

const formatCommand = (command: IPluginCommandConfig, manifest: IPluginManifest, pluginPath: string): IPluginCommand => {
  checkCommand(command)
  const item = {
    ...command,
    name: command.name,
    title: command.title ?? manifest.title,
    subtitle: command.subtitle ?? manifest.subtitle,
    icon: joinPath(command.icon ?? manifest.icon, pluginPath),
    mode: command.mode ?? 'none',
    entry: command.entry && !command.entry.startsWith('http://') && !command.entry.startsWith('https://') ? nodePath.join(command.entry, pluginPath) : command.entry,
    preload: command.preload ? nodePath.join(pluginPath, command.preload) : command.preload,
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

export const registerPlugin = async (pluginPath: string) => {
  console.log('addPlugin', pluginPath)
  if (checkPluginsRegistered(pluginPath)) {
    console.warn('插件已注册,请勿重复注册: ' + pluginPath)
    return
  }
  try {
    const pkg = JSON.parse(await fs.promises.readFile(nodePath.join(pluginPath, './package.json'), { encoding: 'utf-8' }))
    const publicPlugin = pkg.publicPlugin
    const { commands: _, icon, ...rest } = publicPlugin;
    const entry = rest.entry || pkg.main
    const name = rest.name || pkg.name
    const manifest: IPluginManifest = { name, ...rest, entry, icon: icon ? joinPath(icon, pluginPath) : icon }
    checkManifest(manifest)
    const commands: IPluginCommand[] = (publicPlugin.commands || []).map((item: any) => formatCommand(item, manifest, pluginPath))
    const pluginInstance: IRunningPlugin = {
      manifest,
      path: pluginPath,
      commands
    }
    if (entry && !pluginsSettings?.[name]?.disabled) {
      const entryPath = nodePath.join(pluginPath, entry)
      const createPlugin = (__non_webpack_require__(entryPath).default || __non_webpack_require__(entryPath)) as IPlugin
      const plugin = createPlugin({
        updateCommands: (commands: IPluginCommandConfig[]) => {
          pluginInstance.commands = commands.map(item => formatCommand(item, manifest, pluginPath))
        },
        showCommands: (commands: IPluginCommandConfig[]) => {
          commands.forEach(command => resultsMap.set(formatCommand(command, manifest, pluginPath), { score: 1, query: '', owner: pluginInstance }))
          window.dispatchEvent(new CustomEvent('plugin:showCommands', { detail: { name: manifest.name, commands }}))
        },
        enter: (command, options) => {
          return window.publicApp!.enter(name, command, options)
        },
        getPreferences: () => {
          return pluginsSettings[name]?.preferences || {}
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

export const unregisterPlugin = (name: string) => {
  plugins.delete(name)
}

export const getPlugins = (options?: { includeDisabledPlugins?: boolean, includeDisabledCommands?: boolean }) => {
  if (options?.includeDisabledPlugins && options?.includeDisabledCommands) {
    return plugins
  }
  return [...plugins].reduce<Map<string, IRunningPlugin>>((acc, [name, plugin]) => {
    const settings = pluginsSettings[name]
    const need = options?.includeDisabledPlugins || !options?.includeDisabledPlugins && !settings?.disabled
    if (!need) return acc
    const commands = plugin.commands.filter(command => {
      if (options?.includeDisabledCommands) return true
      const settings = pluginsSettings[name]?.commands?.[command.name]
      return !settings?.disabled
    })
    acc.set(name, {
      ...plugin,
      commands
    })
    return acc
  }, new Map())
}

export const disablePlugin = (name: string, disabled: boolean) => {
  const plugin = plugins.get(name)
  if (!plugin) {
    console.warn('插件不存在: ' + name)
    return
  }
  const settings = pluginsSettings[name]
  if (!settings) {
    pluginsSettings[name] = {
      disabled,
      commands: {}
    }
    return
  }
  pluginsSettings[name]!.disabled = disabled
}

export const disablePluginCommand = (name: string, commandName: string, disabled: boolean) => {
  const plugin = plugins.get(name)
  if (!plugin) {
    console.warn('插件不存在: ' + name)
    return
  }
  const settings = pluginsSettings[name]
  if (!settings) {
    pluginsSettings[name] = {
      disabled: false,
      commands: {
        [commandName]: {
          disabled,
          alias: '',
          shortcuts: '',
        }
      }
    }
    return
  }
  if (!settings.commands) {
    settings.commands = {
      [commandName]: {
        disabled,
        alias: '',
        shortcuts: '',
      }
    }
    return
  }
  if (!settings.commands[commandName]) {
    settings.commands[commandName] = {
      disabled,
      alias: '',
      shortcuts: '',
    }
    return
  }
  settings!.commands![commandName]!.disabled = disabled
}


export const updatePluginsSettings = (value: IPluginsSettings) => {
  pluginsSettings = value
}
