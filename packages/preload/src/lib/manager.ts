import * as nodePath from 'path'
import * as fs from 'fs'
import Ajv from 'ajv';
import schema from './public.schema.json' 
import { ICommandSettings, IPlugin, IPluginCommand, IPluginCommandConfig, IPluginManifest, IPluginManifestConfig, IPluginReturn, IPluginSettings, IPluginsSettings, IRunningPlugin, ITextPluginCommandMatch } from '@public/shared'
import { hanziToPinyin } from '@public/utils';
import { db } from './utils';

const ajv = new Ajv({ allowUnionTypes: true })
const validate = ajv.compile(schema)

const plugins: Map<string, IRunningPlugin> = new Map()
let pluginsSettings: IPluginsSettings & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta | IPluginsSettings = {}

const resultsMap = new WeakMap<IPluginCommand, { score: number, query: string, owner: IRunningPlugin }>()

declare const __non_webpack_require__: NodeRequire;

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

const joinPath = (relativePath: string | undefined, path: string) => {
  if (!relativePath) return relativePath
  if (/^\w+:\/\//.test(relativePath)) {
    return relativePath
  }
  return 'ipublic://public.qwertyyb.com/local-file?path=' + encodeURIComponent(nodePath.join(path, relativePath))
}

const save = () => {
  return db.put({ ...pluginsSettings, _id: 'pluginsSettings' }).then(result => {
    pluginsSettings._rev = result.rev
  })
}

const formatCommand = (command: IPluginCommandConfig, manifest: IPluginManifest, pluginPath: string): IPluginCommand => {
  const item = {
    ...command,
    name: command.name,
    title: command.title,
    subtitle: command.subtitle,
    icon: joinPath(command.icon ?? manifest.icon, pluginPath)!,
    mode: command.mode ?? 'none',
    entry: joinPath(command.entry, pluginPath),
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
  if (validate(manifest)) return;

  if (validate.errors?.length) {
    console.error(manifest, validate.errors)
    const err = new Error('校验失败')
    // @ts-ignore
    err.errors = [...validate.errors]
    throw err
  }
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
    const main = rest.main || pkg.main
    const name = rest.name || pkg.name
    const manifest: IPluginManifest = { name, ...rest, main, icon: icon ? joinPath(icon, pluginPath) : icon }
    checkManifest({ ...manifest, commands: _ })
    const commands: IPluginCommand[] = (publicPlugin.commands || []).map((item: any) => formatCommand(item, manifest, pluginPath))
    if (!pluginsSettings[name]) {
      pluginsSettings[name] = { disabled: false, commands: {}, preferences: {} }
    }
    const pluginInstance: IRunningPlugin = {
      manifest,
      path: pluginPath,
      commands,
      settings: pluginsSettings[name]
    }
    if (main && !pluginsSettings?.[name]?.disabled) {
      const entryPath = nodePath.join(pluginPath, main)
      const createPlugin = (__non_webpack_require__(entryPath).default || __non_webpack_require__(entryPath)) as IPlugin
      // const result = await import(entryPath)
      // const createPlugin = (result.default || result) as IPlugin 
      const plugin = createPlugin({
        updateCommands: (commands: IPluginCommandConfig[]) => {
          pluginInstance.commands = commands.map(item => formatCommand(item, manifest, pluginPath))
        },
        showCommands: (commands: IPluginCommandConfig[]) => {
          commands.forEach(command => resultsMap.set(formatCommand(command, manifest, pluginPath), { score: 1, query: '', owner: pluginInstance }))
          window.dispatchEvent(new CustomEvent('plugin:showCommands', { detail: { name: manifest.name, commands }}))
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
    console.error(err)
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
    const need = options?.includeDisabledPlugins || !options?.includeDisabledPlugins && !plugin.settings?.disabled
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
    save()
    return
  }
  pluginsSettings[name]!.disabled = disabled
  save()
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
    save()
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
    save()
    return
  }
  if (!settings.commands[commandName]) {
    settings.commands[commandName] = {
      disabled,
      alias: '',
      shortcuts: '',
    }
    save()
    return
  }
  settings!.commands![commandName]!.disabled = disabled
  save()
}


export const updatePluginsSettings = (value: IPluginsSettings) => {
  // pluginsSettings = value
}

export const updatePluginSettings = (name: string, value: Partial<Omit<IPluginSettings, 'commands'>>) => {
  const plugin = plugins.get(name)
  if (!plugin) return;
  Object.entries(value).forEach(([key, val]) => {
    // @ts-ignore
    plugin.settings![key] = val
  })
}

export const updateCommandSettings = (pluginName: string, commandName: string, settings: ICommandSettings) => {
  const plugin = plugins.get(pluginName)
  if (!plugin) return;
  plugin.settings!.commands[commandName] = { ...plugin.settings, ...settings }
}

export const getPlugin = (name: string) => {
  return plugins.get(name)
}

export const launchPlugins = async () => {
  const result = await db.get<IPluginsSettings>('pluginsSettings')
    .catch(err => {
      console.error(err)
      return {}
    })
  pluginsSettings = result

  const names = [
    'launcher', 'command', 'calculator', 'qrcode', 'search', 'translate', 'clipboard',
    'douban', 'magic', 'ai-chat', 'v2ex', 'terminal', 'find', 'google-chrome', 'mdn', 'shortcuts', 'transform',
    'settings'
  ]
  
  const pluginsPathList = names.map(name => ({ path: nodePath.join(__dirname, '../plugins', name) }))
  pluginsPathList.forEach(({ path }) => {
    registerPlugin(path).catch(err => {
      console.error(err)
    })
  })
}

// launchPlugins()

export const updatePluginPreferences = (name: string, prfs: Record<string, any>) => {
  const plugin = plugins.get(name)
  if (!plugin) return;
  if (plugin.settings) {
    plugin.settings.preferences = { ...plugin.settings.preferences, ...prfs }
  } else {
    plugin.settings = {
      disabled: false,
      commands: {},
      preferences: { ...prfs }
    }
  }

  save()
}

export const updateCommandPreferences = (pluginName: string, commandName: string, prfs: Record<string, any>) => {
  updatePluginPreferences(pluginName, {})
  if (!plugins.get(pluginName)) return;
  const command = plugins.get(pluginName)!.settings!.commands[commandName]
  if (command) {
    plugins.get(pluginName)!.settings!.commands[commandName]!.preferences = { ...command.preferences, ...prfs }
  } else {
    plugins.get(pluginName)!.settings!.commands[commandName] = {
      disabled: false,
      preferences: { ...prfs }
    }
  }

  save()
}

