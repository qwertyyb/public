import { hToM, msToDuration, msToLocaleString, mToS, sToLocaleString, sToMs } from "./time"

const transformPlugin: IPlugin = (utils) => {
  return {
    onInput(keyword) {
      const commands: IPluginCommandConfig[] = []
      if (/^\d+ms$/.test(keyword)) {
        // 1720524483000ms
        const num = window.parseInt(keyword, 10)
        if (num.toString().length >= 13) {
          const value = msToLocaleString(num)
          commands.push({
            name: 'ms2string',
            title: '= ' + value,
            value,
            subtitle: '时间',
            matches: [
              { type: 'text', keywords: [keyword] }
            ]
          })
        }
        const value = msToDuration(num)
        commands.push({
          name: 'ms2duration',
          title: '=' + value,
          value,
          subtitle: '时长',
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      } else if (/^\d+s$/.test(keyword)) {
        const num = window.parseInt(keyword, 10)
        if (num.toString().length >= 10) {
          const value = sToLocaleString(num)
          commands.push({
            name: 'ms2string',
            title: '= ' + value,
            value,
            subtitle: '时间',
            matches: [
              { type: 'text', keywords: [keyword] }
            ]
          })
        }
        const value = sToMs(num)
        commands.push({
          name: 'ms2duration',
          title: '=' + value,
          subtitle: '时长',
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      } else if (/^\d+m$/.test(keyword)) {
        const num = window.parseInt(keyword, 10)
        const value = mToS(num)
        commands.push({
          name: 'ms2duration',
          title: '=' + value,
          subtitle: '时长',
          value,
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      } else if (/^\d+h$/.test(keyword)) {
        const num = window.parseInt(keyword, 10)
        const value = hToM(num)
        commands.push({
          name: 'ms2duration',
          title: '=' + value,
          value,
          subtitle: '时长',
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      }
      
      const [prefix, ...rest] = keyword.split(' ')
      const value = rest.join(' ')
      if(prefix === 'enc' || prefix === 'encode') {
        const text = encodeURIComponent(value)
        commands.push({
          name: 'encodeURIComponent',
          title: '= ' + text,
          subtitle: 'encodeURIComponent',
          value: text,
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      } else if (prefix === 'decode' || prefix === 'dec') {
        const text = encodeURIComponent(value)
        commands.push({
          name: 'decodeURIComponent',
          title: '= ' + text,
          subtitle: 'decodeURIComponent',
          value: text,
          matches: [
            { type: 'text', keywords: [keyword] }
          ]
        })
      }
      console.log('commands', commands)
      utils.updateCommands(commands)
    },
    onEnter(command) {
      require('electron').clipboard.writeText(command.value)
    }
  }
}

export default transformPlugin
