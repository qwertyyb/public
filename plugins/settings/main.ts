import { CommonListItem, PublicApp, PublicPlugin } from "../../shared/types/plugin";
import { ipcRenderer } from 'electron'

const KEYWORDS = [
  'public settings',
  '设置'
]

const formatDate = function(date: Date, fmt: string = 'yyyy-MM-dd hh:mm:ss') { 
  var o = { 
     "M+" : date.getMonth()+1,                 //月份 
     "d+" : date.getDate(),                    //日 
     "h+" : date.getHours(),                   //小时 
     "m+" : date.getMinutes(),                 //分 
     "s+" : date.getSeconds(),                 //秒 
     "q+" : Math.floor((date.getMonth()+3)/3), //季度 
     "S"  : date.getMilliseconds()             //毫秒 
 }; 
 if(/(y+)/.test(fmt)) {
         fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length)); 
 }
  for(var k in o) {
     if(new RegExp("("+ k +")").test(fmt)){
       // @ts-ignore
          fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
      }
  }
 return fmt; 
}

const createDatabase = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS settings (
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`
  await window.publicApp.db.run(sql)
  return window.publicApp.db.run(`CREATE INDEX IF NOT EXISTS textIndex on settings(key)`)
}

const insertRecord = async (record: { key: string, value: {} }) => {
  const sql = `INSERT INTO settings(key, value, createdAt, updatedAt) values ($key, $value, $createdAt, $updatedAt)`
  return window.publicApp.db.run(sql, {
    $key: record.key,
    $value: JSON.stringify(record.value),
    $createdAt: formatDate(new Date()),
    $updatedAt: formatDate(new Date())
  })
}

const queryRecord = async ({ key = '' } = {}) => {
  const sql = `SELECT * FROM settings where key = $key`
  const record = await window.publicApp.db.get(sql, { $key: key  })
  if (record) {
    record.value = JSON.parse(record.value)
  }
  return record;
}

const updateRecord = async ({ key = '', value = {} } = {}) => {
  const sql = `UPDATE settings SET value = $value, updatedAt = $updatedAt where key = ${key}`
  return window.publicApp.db.run(sql, {
    $value: JSON.stringify(value),
    $updatedAt: formatDate(new Date()),
    $key: key
  })
}

const getDefaultSettings = () => {
  return {
    launchAtLogin: true,
    shortcut: 'CommandOrControl+Space',
    shortcuts: [
      { keyword: 'cp ', shortcut: 'Command+Shift+V' }
    ]
  }
}

const registerShortcuts = (settings: any) => {
  const { shortcut, shortcuts } = settings;
  const list = [
    { shortcut, keyword: '' },
    ...shortcuts
  ]
  const remote = require('@electron/remote')
  const globalShortcut = remote.globalShortcut
  globalShortcut.unregisterAll()
  list.forEach(({ keyword, shortcut, temp }) => {
    shortcut && !temp && globalShortcut.register(shortcut, () => {
      window.publicApp.getMainWindow().show()
      // @ts-ignore
      keyword && window.setQuery && window.setQuery(keyword)
    })
  })
}

const registerLaunchAtLogin =(settings: any) => {
  // 启动项
  require('@electron/remote').app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin
  })
}

const getSettings = async () => {
  let value = await createDatabase().then(() => queryRecord({ key: 'config' })).then(res => res?.value)
  if (!value) {
    value = getDefaultSettings()
    insertRecord({ key: 'config', value })
  }
  return value
}

const updateSettings = async (settings: any) => {
  updateRecord({ key: 'config', value: settings })
}

const initSettings = async () => {
  const settings = await getSettings()
  registerLaunchAtLogin(settings)
  registerShortcuts(settings)
}

let win: any = null;

export default (app: PublicApp): PublicPlugin => {

  // @ts-ignore 注册快捷键
  window.requestIdleCallback(() => {
    initSettings()
  })

  // @ts-ignore 注册开机启动
  // window.requestIdleCallback(() => {
  //   require('@electron/remote').app.setLoginItemSettings({
  //     openAtLogin: getLocalSettings().autoLaunch
  //   })
  // })

  // ipcRenderer.on('plugin:settings:registerShortcut', (e: any, arg: any) => {
  //   updateSettings(arg.settings);
  //   registerShortcut(app);
  // })
  // ipcRenderer.on('plugin:settings:openAtLogin', (e: any, arg: any) => {
  //   updateSettings(arg.settings);
  //   require('@electron/remote').app.setLoginItemSettings({
  //     openAtLogin: getLocalSettings().autoLaunch
  //   })
  // })
  return {
    title: '设置',
    icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
    subtitle: 'Public设置',
    onInput(
      keyword: string
    ) {
      keyword = keyword.toLocaleLowerCase()
      if (app.getUtils().match(KEYWORDS, keyword)) {
        app.setList([
          {
            title: '设置',
            subtitle: 'Public设置',
            icon: 'https://img.icons8.com/nolan/64/settings--v1.png',
            key: 'public:settings',
            onEnter: () => {
              if (win) {
                win?.show()
                return;
              }
              const path = require('path')
              const { BrowserWindow } = require('@electron/remote')
              win = new BrowserWindow({
                width: 800,
                height: 600,
                show: false,
                webPreferences: {
                  devTools: true,
                  nodeIntegration: true,
                  enableRemoteModule: true,
                  contextIsolation: false,
                }
              })
              win.webContents.loadFile(path.join(__dirname, './index.html'))
              win.webContents.openDevTools()
              win.on('close', () => {
                win = null
              })
              win.on('ready-to-show', () => {
                win.show()
              })
            }
          }
        ])
      } else {
        app.setList([])
      }
    }
  }
}