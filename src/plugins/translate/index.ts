import { PublicApp, PublicPlugin } from "src/shared/types/plugin";

const TRIGGERS = ['fy', 'ts', 'trans', 'translate', '翻译']

const getResponse = (text: string) => fetch(`http://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(text)}`)
  .then(response => response.json())
  .then(res => res.translateResult[0][0])

export default {
    title: '翻译',
    subtitle: '翻译输入内容',
    icon: 'https://img.icons8.com/color/144/000000/google-translate.png',
    async onInput (keyword) {
      const [first, ...rest] = keyword.split(' ')
      const param = rest.join(' ')
      if (!TRIGGERS.includes(first) || !param.trim()) return window.publicApp.setList([])
      const response = await getResponse(param)
      window.publicApp.setList([
        {
          key: 'plugin:translate:youdao',
          title: response.tgt,
          subtitle: '来自有道翻译',
          icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
        }
      ])
    }
}