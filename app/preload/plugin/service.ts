import * as nodePath from 'path'
import { IActionItem, IFullPluginCommandMatch, IPluginCommand, IPluginCommandMatch, IPluginSettings, IPluginsSettings, IRunningPlugin, ITriggerPluginCommandMatch } from '@public/shared'
import { getConfig } from '../../config';
import { getPlugins } from './manager';

let pluginsSettings: Record<string, IPluginSettings> = {}

const resultsMap = new WeakMap<IPluginCommand, { score: number, query: string, owner: IRunningPlugin }>()

// 计算匹配分数，越大表示匹配度越高，最大为1
const calcScore = (query: string, target: string) => {
  if (query && target.includes(query)) {
    return query.length / target.length
  }
  return -1
}

export const handleQuery = (keyword: string) => {
  const plugins = getPlugins()
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

export const handleSelect = (command: IPluginCommand, keyword: string) => {
  const rp = resultsMap.get(command)
  return rp?.owner.plugin?.onSelect?.(command, rp.query)
}

export const enterPluginCommand = (owner: IRunningPlugin, command: IPluginCommand, options?: { query: string }) => {
  const query = options?.query || ''
  if (command.mode === 'none') {
    owner.plugin?.onEnter?.(command, query)
  } else if (command.mode === 'listView') {
    // js entry
    window.publicApp?.enter(owner.manifest.name, command, {
      entry: getConfig().rendererEntry + '#/plugin/list-view',
      preload: command.preload || '',
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
    window.publicApp?.enter(owner.manifest.name, command, {
      entry: command.entry,
      preload: command.preload,
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

export const handleEnter = (command: IPluginCommand) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  enterPluginCommand(rp.owner, command, { query: rp.query })
}

export const handleAction = (command: IPluginCommand, action: IActionItem, keyword: string) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  rp.owner.plugin?.onAction?.(command, action, keyword)
}