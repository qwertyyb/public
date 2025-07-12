import { IActionItem, ICommandAliasMatchData, ICommandFullMatchData, ICommandMatchData, ICommandRegExpMatchData, ICommandTextMatchData, ICommandTriggerMatchData, IFullPluginCommandMatch, IPluginCommand, IRegExpPluginCommandMatch, IRunningPlugin, ITextPluginCommandMatch, ITriggerPluginCommandMatch } from '@public/shared'
import { enterCommand, getPlugins } from './manager';
import { joinPath } from './utils';
import { hanziToPinyin } from '@public/utils';

// 计算匹配分数，越大表示匹配度越高，最大为1
const calcScore = (query: string, target: string) => {
  return query.length / target.length
}

const match = (query: string, target: string) => {
  const arr = Array.from(query.toLocaleLowerCase())

  let index = 0
  let indexes: number[] = []

  const targetArr = Array.from(target.toLocaleLowerCase());
  for (let i = 0; i < arr.length; i++) {
    const char = arr[i]
    const targetIndex = targetArr.indexOf(char, index)
    if (targetIndex >= 0) {
      indexes.push(targetIndex)
      index = targetIndex + 1
    } else {
      index = 0
      indexes = []
      break
    }
  }

  let score = indexes.length / targetArr.length

  if (indexes.length === 0 && /\p{sc=Han}/u.test(target)) {
    // 有汉字，尝试汉字转拼音匹配
    const targetArr = Array.from(target.toLocaleLowerCase())
      .map((char, index) => {
        if (/\p{sc=Han}/u.test(char)) {
          const pinyin = hanziToPinyin(char);
          return Array.from(pinyin).map((i) => {
            return { char: i, index };
          });
        } else {
          return [{ char, index }];
        }
      })
      .flat();

    for (let i = 0; i < arr.length; i++) {
      const char = arr[i];
      const targetIndex = targetArr.slice(index).findIndex((item) => item.char === char);
      if (targetIndex < 0) {
        return {
          score: -1,
          markedText: target,
        }
      }
      const targetItem = targetArr[targetIndex + index];
      indexes.push(targetItem.index);
      index = index + targetIndex + 1;
    }
    score = indexes.length / targetArr.length
  }
    
  indexes.forEach((i) => (targetArr[i] = `<mark>${targetArr[i]}</mark>`));

  return {
    score,
    markedText: targetArr.join('')
  }
}

const compileString = (template: string, vars: any) => {
  const func = new Function('matches', `return \`${template.replaceAll('`', '``')}\``)
  return func(vars)
}

const CommandOnInputBaseScore = 100
const CommandAliasBaseScore = 10
const CommandTriggerMatchBaseScore = 5

export const calcCommandMatchInfo = (keyword: string, command: IPluginCommand, options?: { alias?: string }) => {

  if (options?.alias && match(keyword, options.alias).score > 0) {
    const result = { ...command }
    const score = CommandAliasBaseScore + calcScore(keyword, options.alias)
    return { result, matchInfo: { from: 'alias', query: keyword, score, keyword } } as {
      result: IPluginCommand,
      matchInfo: Omit<ICommandAliasMatchData, 'owner'>
    }
  }

  const titleMatch = command.title && match(keyword, command.title)
  if (titleMatch && titleMatch.score > 0) {
    const result = { ...command, title: titleMatch.markedText }
    return { result, matchInfo: { from: 'alias', query: keyword, score: titleMatch.score, keyword } } as {
      result: IPluginCommand,
      matchInfo: Omit<ICommandAliasMatchData, 'owner'>
    }
  }

  const subtitleMatch = command.subtitle && match(keyword, command.subtitle)
  if (subtitleMatch && subtitleMatch.score > 0) {
    const result = { ...command, subtitle: subtitleMatch.markedText }
    return {
      result,
      matchInfo: {
        from: "alias",
        query: keyword,
        score: subtitleMatch.score,
        keyword,
      },
    } as {
      result: IPluginCommand;
      matchInfo: Omit<ICommandAliasMatchData, "owner">;
    };
  }

  const matches = command.matches || []
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
    const matchKeyword = textMatch.keywords.find(word => match(keyword, word).score > 0)
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

const resultsMap = new WeakMap<IPluginCommand, ICommandMatchData & { owner: IRunningPlugin }>()

export const handleQuery = async (keyword: string) => {
  let results: IPluginCommand[] = [];

  let plugins = getPlugins()
  let inputCount = 0
  await Promise.all(
    [...plugins.values()].map(plugin => {
      if (typeof plugin.plugin?.onInput !== 'function') return
      return Promise.resolve(plugin.plugin?.onInput(keyword)).then(list => {
        if (!list) return;
        if (!Array.isArray(list)) return;
        list.forEach(item => {
          if (!item.title && !item.subtitle && !item.icon) return;
          const { icon, score, ...rest } = item
          const result = {
            ...rest,
            icon: joinPath(item.icon, plugin.path)
          }
          results.push(result)
          inputCount += 1
          resultsMap.set(result, { owner: plugin, from: 'onInput', keyword, query: keyword, score: score || CommandOnInputBaseScore + inputCount })
        })
      })
    })
  )
  // 执行 onInput 后，可能会更新 commands，所以需要重新获取一下
  plugins = getPlugins()
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

export const handleEnter = (command: IPluginCommand) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  enterCommand(rp.owner, command, rp)
}

export const handleAction = (command: IPluginCommand, action: IActionItem, keyword: string) => {
  const rp = resultsMap.get(command)
  if (!rp) return
  rp.owner.plugin?.onAction?.(command, action, keyword)
}
