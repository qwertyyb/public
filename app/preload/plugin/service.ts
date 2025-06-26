import { IActionItem, ICommandMatchData, IPluginCommand, IPreference, IRunningPlugin } from '@public/shared'
import { getPlugins } from './manager';
import { openCommandPreferences, openPluginPreferences } from '../utils';
import { calcCommandMatchInfo } from '../../utils'

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
    await openPluginPreferences(owner.manifest.name)
  }
  if (!checkRequired(command.preferences || [], owner.settings?.commands[command.name]?.preferences || {})) {
    count += 1
    await openCommandPreferences(owner.manifest.name, command.name)
  }
  return count
}

export const enterPluginCommand = async (owner: IRunningPlugin, command: IPluginCommand, matchData: ICommandMatchData) => {
  // 判断一下组件所需的首选项是否都已填写，如果都已填写，则直接执行，否则跳转去配置
  // 首先需要判断插件层级的必须首选项是否已填写，再检查 command 层级的首选项
  const count = await checkPreferences(owner, command)
  if (count) {
    window.dispatchEvent(new CustomEvent('pop-view', { detail: { count } }))
  }
  if (command.mode === 'none') {
    owner.plugin?.onEnter?.(command, matchData)
  } else {
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
