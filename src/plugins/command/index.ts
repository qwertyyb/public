
const { match } = window.publicApp.getUtils()
const CommandPlugin = {
  title: '系统命令',
  subtitle: '执行锁屏、休眠、关机、重启等系统命令',
  icon: 'https://img.icons8.com/ios-filled/50/000000/command.png',
  onInput: (keyword) => {
    const list = []
    if (match(['锁屏', 'lock'], keyword)) {
      list.push({
        code: 'plugin:command:lock',
        title: '锁屏',
        subtitle: 'Lock',
        key: 'plugin:lockscreen',
        icon: 'https://img.icons8.com/fluent/48/000000/lock.png',
        command: `
          tell application "System Events" to keystroke "q" using {control down, command down}
        `
      })
    }
    if (match(['休眠', '睡眠', 'sleep'], keyword)) {
      list.push({
        code: 'plugin:command:sleep',
        key: 'plugin:command:sleep',
        title: '休眠',
        subtitle: '电脑休眠',
        icon: 'https://img.icons8.com/ios-filled/100/4a90e2/sleep-mode.png',
        command: `
          tell application "System Events"
            start (sleep)
          end tell`
      })
    }
    if (match(['退出', '登出', 'logout'], keyword)) {
      list.push({
        title: '登出',
        subtitle: '退出当前登录的用户',
        icon: 'https://img.icons8.com/nolan/64/logout-rounded-down.png',
        key: 'plugin:command:logout',
        command: `
          tell application "System Events"
            start (log out)
          end tell`
      })
    }
    if (match(['关机', 'shutdown'], keyword)) {
      list.push({
        title: '关机',
        subtitle: '关闭你的电脑',
        icon: 'https://img.icons8.com/nolan/96/shutdown.png',
        key: 'plugin:command:shutdown',
        command:  `
          tell application "System Events"
            start (shut down)
          end tell`
      })
    }
    if (match(['重启', '重新启动', 'restart'], keyword)) {
      list.push({
        code: 'plugin:command:restart',
        key: 'plugin:command:restart',
        title: '重启',
        subtitle: '重启你的电脑',
        icon: 'https://img.icons8.com/nolan/128/restart.png',
        command: `
          tell application "System Events"
            start (restart)
          end tell`
      })
    }
    window.publicApp.setList(list)
  },
  onEnter: (item) => {
    if (!item.command) return;
    const str = `osascript -e '${item.command}'`
    require('child_process').exec(str)
  }
}

module.exports = CommandPlugin