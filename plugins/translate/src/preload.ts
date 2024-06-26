import { PublicApp, PublicPlugin } from "shared/types/plugin";
import { translate } from './youdao'

export default {
  search: window.publicApp.utils.debounce(async (keyword: string, setList: (list: any[]) => void) => {
    if (!keyword) return setList([])
    const result = JSON.parse(await translate(keyword))
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
    setList(results)
  })
}