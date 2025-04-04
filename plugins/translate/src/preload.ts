import { type IPluginCommandListView } from '@public/shared'
import { translate } from './tencent-cloud'

const listView: IPluginCommandListView = {
  search: window.publicApp.utils.debounce(async (keyword: string, setList: (list: any[]) => void) => {
    if (!keyword) return setList([])
    const result = JSON.parse(await translate(keyword))
    const targetText = result.Response.TargetText
    const results = [{
      key: 'plugin:translate:youdao:item-result',
      title: targetText,
      icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
    }]
    setList(results)
  })
}

export default listView