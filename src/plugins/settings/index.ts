const path = require('path')
import { PublicApp, PublicPlugin } from "../../shared/types/plugin"

const KEYWORDS = [
  'public settings',
  '设置'
]


const SettingsPlugin = {
  title: '设置',
  icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
  subtitle: 'Public设置',

  main: './public/index.html',
  onInput(
    keyword: string
  ) {
    keyword = keyword.toLocaleLowerCase()
    if (!window.publicApp.getUtils().match(KEYWORDS, keyword)) {
      return window.publicApp.setList([])
    }
    window.publicApp.setList([
      {
        title: '设置',
        subtitle: 'Public设置',
        icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
        key: 'public:settings'
      }
    ])
  },
  onEnter: () => {
    console.log('ssssss')
    window.publicApp.enterPlugin()
  }
}

module.exports = SettingsPlugin