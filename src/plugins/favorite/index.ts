import { string } from "mathjs";
import { PublicApp, PublicPlugin } from "src/shared/types/plugin";

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
  text: 1,
}

const createDatabase = async () => {
  const sql = `CREATE TABLE IF NOT EXISTS favorite (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contentType INTEGER NOT NULL,
    text TEXT NOT NULL,
    remark TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );`
  await window.publicApp.db.run(sql)
  await Promise.all([
    window.publicApp.db.run(`CREATE INDEX IF NOT EXISTS textIndex on favorite(text)`),
    window.publicApp.db.run(`CREATE INDEX IF NOT EXISTS remarkIndex on favorite(remark)`)
  ])
}

const insertRecord = async (record: { contentType: number, text: string, remark: string }) => {
  const sql = `INSERT INTO favorite(contentType, text, remark, createdAt, updatedAt) values ($contentType, $text, $remark, $createdAt, $updatedAt)`
  return window.publicApp.db.run(sql, {
    $contentType: record.contentType || ContentType.text,
    $text: record.text,
    $remark: record.remark || null,
    $createdAt: formatDate(new Date()),
    $updatedAt: formatDate(new Date())
  })
}

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM favorite where text like $keyword or remark like $keyword order by updatedAt DESC`
  const query = strict ? keyword : `%${keyword}%`
  return window.publicApp.db.all(sql, { $keyword: query })
}

const updateRecord = async (id: number, params: Object) => {
  // @ts-ignore
  const sql = `UPDATE favorite set ${Object.keys(params).map(key => `${key} = '${params[key]}'`).join(',')} where id = $id`
  return window.publicApp.db.run(sql, { $id: id })
}

const createOrUpdateRecord = async ({ remark, text }: { remark: string, text: string }) => {
  const existsItems = await queryRecordList({ keyword: remark }, { strict: true })
  if (existsItems.length) {
    // 已存在，更新记录
    await updateRecord(existsItems[0].id, { updatedAt: formatDate(new Date()), text: text })
  } else {
    await insertRecord({ contentType: ContentType.text, text, remark })
  }
}

export default (app: PublicApp): PublicPlugin => {
  createDatabase()
  return {
    title: '收藏',
    subtitle: '收藏常用的内容',
    icon: 'https://img.icons8.com/cute-clipart/64/000000/likes-folder.png',
    onInput: async (query: string) => {
      const [command, remark = '', ...textArr] = query.split(' ')
      if ((['收藏', 'favorite', 'fa', 'faa', 'fas'].includes(command))) {
        const text = textArr.join(' ')
        if (command === 'faa') {
          app.setList([{
            key: `plugin:favorite:add:${query}`,
            title: text,
            subtitle: `点击收藏为"${remark}"`,
            icon: 'https://img.icons8.com/nolan/64/add-to-favorites.png',
            onEnter: () => {
              createOrUpdateRecord({ remark, text })
            }
          }])
        } else {
          const [_, ...queryArr] = query.split(' ')
          const list = await queryRecordList({ keyword: queryArr.join(' ')})
          app.setList(list.map((item: any) => ({
            key: `plugin:favorite:query:${item.remark}`,
            title: item.text,
            subtitle: item.remark,
            icon: 'https://img.icons8.com/cute-clipart/64/000000/likes-folder.png',
            onEnter: () => {
              require('electron').clipboard.writeText(item.text)
              setTimeout(() => {
                require('robotjs').keyTap("v", ["command"])
              }, 16)
            }
          })))
        }
      } else {
        app.setList([])
      }
    }
  }
}