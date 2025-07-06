import api, { type IPlugin, ICommand } from '@public/api'
import { hToM, msToDuration, msToLocaleString, mToS, sToLocaleString, sToMs } from "./lib/time"
import { transformCurrency } from './lib/currency'

const transformPlugin: IPlugin = (utils) => {
  return {
    async onInput(keyword) {
      console.log('keyword', keyword)
      const commands: ICommand[] = []
      if (/^\d+ms$/.test(keyword)) {
        // 1720524483000ms
        const num = window.parseInt(keyword, 10)
        if (num.toString().length >= 13) {
          const value = msToLocaleString(num)
          commands.push({
            icon: '',
            name: 'ms2string',
            title: '= ' + value,
            value,
            subtitle: '时间',
          })
        }
        const value = msToDuration(num)
        commands.push({
          name: 'ms2duration',
          title: '=' + value,
          value,
          subtitle: '时长',
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
      } else {
        commands.push(...await transformCurrency(keyword))
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
        const text = decodeURIComponent(value)
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
      // utils.updateCommands(commands)
      return commands
    },
    onEnter(command) {
      require('electron').clipboard.writeText(command.value)
      api.showHUD('已复制到剪切板')
    }
  }
}

export default transformPlugin
