import { IActionItem, ICommandAliasMatchData, ICommandFullMatchData, ICommandMatchData, ICommandRegExpMatchData, ICommandTextMatchData, ICommandTriggerMatchData, IFullPluginCommandMatch, IPluginCommand, IPreference, IRegExpPluginCommandMatch, IRunningPlugin, ITextPluginCommandMatch, ITriggerPluginCommandMatch } from '@public/shared'
import { getPlugins } from './manager';
import { openCommandPreferences, openPluginPreferences, popView } from './utils';

// 计算匹配分数，越大表示匹配度越高，最大为1
const calcScore = (query: string, target: string) => {
  if (query && target.includes(query)) {
    return query.length / target.length
  }
  return -1
}

const compileString = (template: string, vars: any) => {
  const func = new Function('matches', `return \`${template.replaceAll('`', '``')}\``)
  return func(vars)
}

const CommandAliasBaseScore = 10
const CommandTriggerMatchBaseScore = 5

export const calcCommandMatchInfo = (keyword: string, command: IPluginCommand, options?: { alias?: string }) => {
  if (options?.alias && options.alias.includes(keyword)) {
    const result = { ...command }
    const score = CommandAliasBaseScore + calcScore(keyword, options.alias)
    return { result, matchInfo: { from: 'alias', query: keyword, score, keyword } } as {
      result: IPluginCommand,
      matchInfo: Omit<ICommandAliasMatchData, 'owner'>
    }
  }

  const { matches } = command
  const triggerMatch = matches.find<ITriggerPluginCommandMatch>(match => match.type === 'trigger')
  if (triggerMatch) {
    const triggerIndex = triggerMatch.triggers.findIndex(trigger => keyword.startsWith(trigger + ' '))
    if (triggerIndex >= 0) {
      const trigger = triggerMatch.triggers[triggerIndex]
      const query = keyword.substring(trigger.length + 1)
      const result = {
        ...command,
        title: (query && triggerMatch.title) ? triggerMatch.title.replaceAll('$query', query) : command.title,
        subtitle: (query && triggerMatch.subtitle) ? triggerMatch.subtitle.replaceAll('$query', query) : command.subtitle
      }
      return {
        result,
        matchInfo: { from: 'match', match: triggerMatch, keyword, score: CommandTriggerMatchBaseScore + calcScore(keyword, trigger), matchData: { trigger, query },query }
      } as { result: IPluginCommand, matchInfo: Omit<ICommandTriggerMatchData, 'owner'> }
    }
  }
  const textMatch = matches.find<ITextPluginCommandMatch>(match => match.type === 'text')
  if (textMatch) {
    const matchKeyword = textMatch.keywords.find(word => calcScore(keyword, word) > 0)
    if (matchKeyword) {
      const result = { ...command }
      return {
        result,
        matchInfo: { from: 'match', keyword, score: calcScore(keyword, matchKeyword), match: textMatch, matchData: { keyword: matchKeyword }, query: '' }
      } as { result: IPluginCommand, matchInfo: Omit<ICommandTextMatchData, 'owner'> }
    }
  }
  const regExpMatch = matches.find<IRegExpPluginCommandMatch>(item => item.type === 'regexp')
  if (regExpMatch) {
    const regMatches = keyword.match(new RegExp(regExpMatch.regexp))
    if (regMatches) {
      const result = {
        ...command,
        title: compileString(regExpMatch.title || command.title, regMatches),
        subtitle: compileString(regExpMatch.subtitle || command.subtitle || '', regMatches)
      }
      return {
        result,
        matchInfo: { from: 'match', match: regExpMatch, keyword, score: 0.3, matchData: { matches: regMatches }, query: '' }
      } as { result: IPluginCommand, matchInfo: Omit<ICommandRegExpMatchData, 'owner'> }
    }
  }
  const fullMatch = matches.find<IFullPluginCommandMatch>(item => item.type === 'full')
  if (fullMatch) {
    const result = {
      ...command,
      title: (keyword && fullMatch.title) ? fullMatch.title.replaceAll('$query', keyword) : command.title,
      subtitle: (keyword && fullMatch.subtitle) ? fullMatch.subtitle.replaceAll('$query', keyword) : command.subtitle
    }
    return {
      result,
      matchInfo: { from: 'match', keyword, score: 0.01, match: fullMatch, query: keyword }
    } as { result: IPluginCommand, matchInfo: Omit<ICommandFullMatchData, 'owner'> }
  }
}

const resultsMap = new WeakMap<IPluginCommand, ICommandMatchData>()

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
      const r = calcCommandMatchInfo(keyword, command)
      if (!r) return;
      results.push(r.result)
      resultsMap.set(r.result, { ...r.matchInfo, owner: plugin })
    })
  })
  return results.sort((prev, next) => resultsMap.get(next)!.score - resultsMap.get(prev)!.score)
}

export const handleSelect = (command: IPluginCommand, keyword: string) => {
  const rp = resultsMap.get(command)
  return rp?.owner.plugin?.onSelect?.(command, rp)
}


const checkRequired = (preferences: IPreference[], values: Record<string, any>) => {
  const requiredFields = preferences.filter(i => i.required) || []
  return requiredFields.every(item => values[item.name] || values[item.name] === 0)
}

const checkPreferences = async (owner: IRunningPlugin, command: IPluginCommand) => {
  // 首先需要判断插件层级的必须首选项是否已填写，再检查 command 层级的首选项
  let count = 0
  if (!checkRequired(owner.manifest.preferences || [], owner.settings?.preferences || {})) {
    count += 1
    await openPluginPreferences(owner.manifest.name, { wait: true })
  }
  if (!checkRequired(command.preferences || [], owner.settings?.commands[command.name]?.preferences || {})) {
    count += 1
    await openCommandPreferences(owner.manifest.name, command.name, { wait: true })
  }
  return count
}

export const enterPluginCommand = async (owner: IRunningPlugin, command: IPluginCommand, matchData: ICommandMatchData) => {
  // 判断一下组件所需的首选项是否都已填写，如果都已填写，则直接执行，否则跳转去配置
  // 首先需要判断插件层级的必须首选项是否已填写，再检查 command 层级的首选项
  const count = await checkPreferences(owner, command)
  if (count) {
    popView({ count })
  }
  if (command.mode === 'none') {
    owner.plugin?.onEnter?.(command, matchData)
  } else if (command.mode === 'listView') {
    __non_webpack_require__(command.preload)
    window.dispatchEvent(new CustomEvent('push-view', { detail: { path: '/plugin/list-view', params: { command, plugin: owner, match: matchData } } }))
  } else if (command.mode === 'view') {
    window.dispatchEvent(new CustomEvent('push-view', { detail: { path: '/plugin/view', params: { plugin: owner, command, match: matchData } } }))
  }
}

export const handleEnter = (command: IPluginCommand) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  enterPluginCommand(rp.owner, command, rp)
}

export const handleAction = (command: IPluginCommand, action: IActionItem, keyword: string) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  rp.owner.plugin?.onAction?.(command, action, keyword)
}
