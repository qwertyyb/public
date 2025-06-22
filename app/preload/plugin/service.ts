import * as nodePath from 'path'
import { IActionItem, IFullPluginCommandMatch, IPluginCommand, IPluginCommandMatch, IPluginSettings, IPluginsSettings, IRunningPlugin, ITriggerPluginCommandMatch } from '@public/shared'
import { getConfig } from '../../config';
import { getPlugins } from './manager';

const resultsMap = new WeakMap<IPluginCommand, { score: number, query: string, owner: IRunningPlugin }>()

// 计算匹配分数，越大表示匹配度越高，最大为1
const calcScore = (query: string, target: string) => {
  if (query && target.includes(query)) {
    return query.length / target.length
  }
  return -1
}

export const handleQuery = async (keyword: string) => {
  let plugins = getPlugins()
  await Promise.all(
    [...plugins.values()].map(plugin => plugin.plugin?.onInput?.(keyword))
  )
  // 执行 onInput 后，可能会更新 commands，所以需要重新获取一下
  plugins = getPlugins()
  let results: IPluginCommand[] = []
  plugins.forEach((plugin, name) => {
    const { commands = [] } = plugins.get(name)!
    commands.forEach(command => {
      const { matches } = command
      // const settings = pluginSettings?.commands?.[command.name]
      // const alias = settings?.alias
      // if (alias && alias.includes(keyword)) {
      //   const result = { ...command }
      //   const score = 10 + calcScore(keyword, alias)
      //   results.push(result)
      //   resultsMap.set(result, { query: keyword, score, owner: plugin })
      //   return
      // }

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
    // window.publicApp?.enter(owner.manifest.name, command, {
    //   entry: getConfig().rendererEntry + '#/plugin/list-view',
    //   preload: command.preload || '',
    //   webPreferences: {
    //     nodeIntegration: true,
    //     webSecurity: false,
    //     allowRunningInsecureContent: false,
    //     spellcheck: false,
    //     devTools: true,
    //     contextIsolation: false,
    //     backgroundThrottling: false,
    //     enablePreferredSizeMode: true,
    //     sandbox: false,
    //   }
    // }, query)
    window.dispatchEvent(new CustomEvent('enter-plugin-command', { detail: { plugin: owner, command, query } }))
  } else if (command.mode === 'view') {
    console.log('command', command);
    // html entry
    window.dispatchEvent(new CustomEvent('enter-plugin-command', { detail: { plugin: owner, command, query } }))
    // window.publicApp?.enter(owner.manifest.name, command, {
    //   entry: command.entry,
    //   preload: command.preload,
    //   webPreferences: {
    //     nodeIntegration: true,
    //     webSecurity: false,
    //     allowRunningInsecureContent: false,
    //     spellcheck: false,
    //     devTools: true,
    //     contextIsolation: false,
    //     backgroundThrottling: false,
    //     enablePreferredSizeMode: true,
    //     sandbox: false,
    //   }
    // }, query)
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