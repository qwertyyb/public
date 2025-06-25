import { shell } from 'electron'
import { ICommandTriggerMatchData, IPluginReturn } from '@public/shared'

const urls = {
  google: 'https://www.google.com/search?q=${keyword}',
  baidu: 'https://www.baidu.com/s?wd=${keyword}',
  bing: 'https://www.bing.com/search?q=${keyword}'
}

export default (): IPluginReturn => {
  return {
    onEnter(item, match) {
      const url = urls[item.name as keyof typeof urls]
      if (!url) return;
      const keyword = match.from === 'hotkey'
        ? '' : match.match.type === 'trigger'
        ? (match as ICommandTriggerMatchData).matchData.query : match.keyword
      const target = url.replaceAll('${keyword}', encodeURIComponent(keyword))
      shell.openExternal(target)
    },
  }
}