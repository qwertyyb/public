import { ICommandAliasMatchData, ICommandFullMatchData, ICommandRegExpMatchData, ICommandTextMatchData, ICommandTriggerMatchData, IFullPluginCommandMatch, IPluginCommand, IRegExpPluginCommandMatch, ITextPluginCommandMatch, ITriggerPluginCommandMatch } from '@public/shared'

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
