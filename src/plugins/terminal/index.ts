import { PublicPlugin } from "src/shared/types/plugin";

const KEYWORD = '>'

const plugin: PublicPlugin = {
    title: '执行终端命令',
    subtitle: '在终端中执行输入的命令',
    icon: 'https://img.icons8.com/officel/80/000000/console.png',
    onInput (query: string) {
      const [first, ...rest] = query.split(' ')
      const param = rest.join(' ')
      if (first === KEYWORD) {
        globalThis.publicApp.setList([
          {
            key: 'plugin:terminal',
            title: param || '终端命令',
            subtitle: '在终端执行命令',
            icon: 'https://img.icons8.com/officel/80/000000/console.png',
            command: param
          }
        ])
      } else {
        globalThis.publicApp.setList([])
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

export default plugin