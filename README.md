# Public项目

## 插件示例

```ts
import { PublicApp, PublicPlugin } from "shared/types/plugin";

const TRIGGERS = ['fy', 'ts', 'trans', 'translate', '翻译']

const getResponse = (text: string) => fetch(`http://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(text)}`)
  .then(response => response.json())
  .then(res => res.translateResult[0][0])

export default (app: PublicApp): PublicPlugin => {
  return {
    title: '翻译',
    subtitle: '翻译输入内容',
    icon: 'https://img.icons8.com/color/144/000000/google-translate.png',
    async onInput (keyword) {
      const [first, ...rest] = keyword.split(' ')
      const param = rest.join(' ')
      if (!TRIGGERS.includes(first) || !param.trim()) return app.setList([])
      const response = await getResponse(param)
      app.setList([
        {
          key: 'plugin:translate:youdao',
          title: response.tgt,
          subtitle: '来自有道翻译',
          icon: 'https://img.icons8.com/color/144/000000/google-translate.png'
        }
      ])
    }
  }
}
```

## QA
1. 为什么xx功能不支持windows?
个人兴趣项目，主要满足自用设备的使用，所以windows暂无开发计划

2. 为什么使用Electron?

   1. 放眼长远来看，Electron才是桌面开发的未来
   2. Javascript开发简单，何乐不为
