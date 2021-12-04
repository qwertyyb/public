import { CommonListItem, PublicApp, PublicPlugin } from "src/shared/types/plugin";
import { clipboard } from 'electron'

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

const ContentType = {
  text: 0,
  image: 1
}

const createDatabase = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS clipboardHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contentType INTEGER NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    lastUseAt TEXT NOT NULL
  );`
  await publicApp.db.run(sql)
  return publicApp.db.run(`CREATE INDEX IF NOT EXISTS textIndex on clipboardHistory(text)`)
}

const insertRecord = async (record: { contentType: number, text: string }) => {
  const sql = `INSERT INTO clipboardHistory(contentType, text, createdAt, lastUseAt) values ($contentType, $text, $createdAt, $lastUseAt)`
  return publicApp.db.run(sql, {
    $contentType: record.contentType || ContentType.text,
    $text: record.text,
    $createdAt: formatDate(new Date()),
    $lastUseAt: formatDate(new Date())
  })
}

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM clipboardHistory where text like $keyword order by lastUseAt DESC`
  const query = strict ? keyword : `%${keyword}%`
  return publicApp.db.all(sql, { $keyword: query })
}

const updateRecord = async (id: number, params: Object) => {
  // @ts-ignore
  const sql = `UPDATE clipboardHistory set ${Object.keys(params).map(key => `${key} = '${params[key]}'`).join(',')} where id = $id`
  return publicApp.db.run(sql, { $id: id })
}


const { match } = publicApp.getUtils()
const startListener = (handler: (arg: any) => void) => {
  let lastText: string = '';
  const checkClipboard = () => {
    const text = clipboard.readText()
    if (lastText === text) return;
    lastText = text;
    handler({
      contentType: ContentType.text,
      contentValue: text,
      text: text
    })
  }
  setInterval(checkClipboard, 1000)
}

const newItemHandler = async (data: { contentType: number, contentValue: string, text: string }) => {
  const existsItems = await queryRecordList({ keyword: data.text }, { strict: true })
  console.log('new Data existsItem', existsItems)
  if (!existsItems.length) {
    return insertRecord({ contentType: data.contentType, text: data.text })
  } else {
    existsItems[0].updatedAt = Date.now()
    return updateRecord(existsItems[0].id, { lastUseAt: formatDate(new Date()) })
  }
}
createDatabase().then(_ => {
  startListener(newItemHandler)
})

module.exports = {
  title: '剪切板',
  subtitle: '增强剪切板',
  icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
  onInput: async (query: string) => {
    const [trigger, ...rest] = query.split(' ')
    if (!['剪切板', 'clipboard', 'cp'].includes(trigger)) return publicApp.setList([]);
    const keyword = rest.join(' ')
    let list = await queryRecordList({ keyword })
    list = list.map((item: any): CommonListItem => {
      const subtitle = `最后使用: ${item.lastUseAt}     创建于: ${item.createdAt}`
      return {
        key: `plugin:clipboard:${item.text}`,
        title: item.text,
        subtitle,
        icon: 'https://img.icons8.com/cute-clipart/64/000000/clipboard.png',
        contentValue: item.text
      }
    })
    globalThis.publicApp.setList(list)
  },
  onEnter: (item) => {
    clipboard.writeText(item.contentValue)
    // app.getApp().robot.keyTap("v", ["command"])
  }
}