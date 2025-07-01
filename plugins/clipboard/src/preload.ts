import { clipboard, NativeImage } from 'electron'
import { IPlugin } from '@public/shared'
import { ContentType, getHash } from './const';

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
  const sql = `CREATE TABLE IF NOT EXISTS clipboardHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contentType INTEGER NOT NULL,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    lastUseAt TEXT NOT NULL,
    content BLOB NULL DEFAULT NULL,
    application TEXT NULL DEFAULT NULL,
    hash TEXT NULL DEFAULT NULL
  );`
  await window.publicApp.db.run(sql)
  return window.publicApp.db.run(`CREATE INDEX IF NOT EXISTS hashIndex on clipboardHistory(hash)`)
}

const insertRecord = async (record: { contentType: number, text: string, content: Buffer | null, hash: string }) => {
  const sql = `INSERT INTO clipboardHistory(contentType, text, content, createdAt, lastUseAt, hash) values ($contentType, $text, $content, $createdAt, $lastUseAt, $hash)`
  console.log(record)
  return window.publicApp.db.run(sql, {
    contentType: record.contentType || ContentType.text,
    text: record.text,
    content: record.content || null,
    createdAt: formatDate(new Date()),
    lastUseAt: formatDate(new Date()),
    hash: record.hash
  })
}

const queryRecordList = async ({ keyword = '' } = {}, { strict = false } = {}) => {
  const sql = `SELECT * FROM clipboardHistory order by lastUseAt DESC limit 30`
  const query = strict ? keyword : `%${keyword}%`
  const results = await window.publicApp?.db.all(sql, { keyword: query })
  return results
}

const getExist = async (hash: string) => {
  const results = await window.publicApp.db.all('SELECT id FROM clipboardHistory where hash = $hash', {
    hash
  })
  return results[0]
}

const updateRecord = async (id: number, params: Object) => {
  // @ts-ignore
  const sql = `UPDATE clipboardHistory set ${Object.keys(params).map(key => `${key} = '${params[key]}'`).join(',')} where id = $id`
  return window.publicApp.db.run(sql, { id: id })
}

interface ClipboardData {
  type: ContentType,
  content: string | NativeImage
}

const isSame = (last: ClipboardData | null, cur: ClipboardData) => {
  if (last?.type !== cur.type) return false
  if (typeof last.content !== typeof cur.content) return false
  if (typeof last.content === 'string') {
    return last.content === cur.content
  }
  const pre = (last.content as NativeImage).toPNG()
  const next = (cur.content as NativeImage).toPNG()
  return pre.equals(next)
}

const clipboardPlugin: IPlugin = (utils) => {
  const startListener = (handler: (arg: any) => void) => {
    let last: ClipboardData | null = null
    const checkClipboard = async () => {
      const text = clipboard.readText()
      const image = clipboard.readImage()
      if (!text && image.isEmpty()) return;
      const cur: ClipboardData = { type: image.isEmpty() ? ContentType.text : ContentType.image, content: image.isEmpty() ? text : image }
      if (isSame(last, cur)) return;
      last = cur
      const buffer = cur.type === ContentType.image ? image.toPNG() : Buffer.from(text)
      handler({
        contentType: cur.type,
        text: cur.type === ContentType.text ? cur.content : '',
        content: cur.type === ContentType.text ? null : buffer,
        hash: await getHash(buffer)
      })
    }
    setInterval(checkClipboard, 1000)
  }

  const newItemHandler = async (data: { contentType: ContentType, content: Buffer | null, text: string, hash: string }) => {
    const exist = await getExist(data.hash)
    if (!exist) {
      return insertRecord({ contentType: data.contentType, text: data.text, content: data.content, hash: data.hash })
    } else {
      console.log('已存在，更新 lastUseAt', data.hash)
      exist.updatedAt = Date.now()
      return updateRecord(exist.id, { lastUseAt: formatDate(new Date()) })
    }
  }
  createDatabase().then(_ => {
    startListener(newItemHandler)
  })

  return {}
}

export default clipboardPlugin
