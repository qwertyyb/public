import { PublicApp, PublicPlugin } from "shared/types/plugin";

const KEYWORD = '>'

export default (app: PublicApp): PublicPlugin => {
  return {
    onInput (query: string) {
      const [first, ...rest] = query.split(' ')
      const param = rest.join(' ')
      if (first === KEYWORD) {
        app.setList([
          {
            key: 'plugin:terminal',
            title: param || '终端命令',
            subtitle: '在终端执行命令',
            icon: 'https://img.icons8.com/officel/80/000000/console.png',
            command: param
          }
        ])
      } else {
        app.setList([])
      }
    },
    onEnter(item) {
      require('child_process').spawn('osascript', [
        '-e',
        `tell application "Terminal" to do script ${JSON.stringify(item.command)}
        activate application "Terminal"`
      ]);
    }
  }
}