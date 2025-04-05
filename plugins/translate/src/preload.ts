import { type IPluginCommandListView } from '@public/shared'
// import { translate } from './tencent-cloud'
import { translate } from './iciba'

const listView: IPluginCommandListView = {
  search: window.publicApp.utils.debounce(async (keyword: string, setList: (list: any[]) => void) => {
    if (!keyword) return setList([])
    const results = await translate(keyword)
    console.log(results)
    
    // let results = []
    // if (result.TargetText) {
    //   results.push({
    //     key: 'plugin:translate:youdao:item-result',
    //     title: result.TargetText,
    //     icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
    //   })
    // } else if (result.Error) {
    //   results.push({
    //     key: 'plugin:translate:youdao:item-error',
    //     title: result.Error.Message,
    //     subtitle: `Error: ${result.Error.Code}`,
    //     icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
    //   })
    // }
    setList(results)
  }, 700)
}

export default listView