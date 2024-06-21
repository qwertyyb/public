import { PublicApp, PublicPlugin } from "shared/types/plugin";
import { translate } from './youdao'

const TRIGGERS = ['fy', 'ts', 'trans', 'translate', '翻译']

export default (app: PublicApp): PublicPlugin => {
  return {
    async onInput (keyword) {
      const [first, ...rest] = keyword.split(' ')
      const param = rest.join(' ')
      if (!TRIGGERS.includes(first) || !param.trim()) return app.setList([])
      const result = JSON.parse(await translate(param))
      console.log(result)
      const { dictResult, translateResult } = result
      const { trs, wfs } = dictResult?.ec?.word || {}
      const results = translateResult.flat().map((item, index) => {
        return {
          key: 'plugin:translate:youdao:item-' + index,
          title: item.tgt,
          icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
        }
      })
      results.push(...(trs ?? []).map((item, index) => ({
        key: 'plugin:translate:youdao:trs-' + index,
        title: item.tran,
        subtitle: item.pos,
        icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
      })))
      results.push(...(wfs ?? []).map((item, index) => ({
        key: 'plugin:translate:youdao:wfs-' + index,
        title: item.wf.value,
        subtitle: item.wf.name,
        icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
      })))
      app.setList(results)
    }
  }
}