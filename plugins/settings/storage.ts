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
  const sql = `UPDATE settings SET value = $value, updatedAt = $updatedAt where key = $key`
  return window.publicApp.db.run(sql, {
    $value: JSON.stringify(value),
    $updatedAt: formatDate(new Date()),
    $key: key
  })
}

export { updateRecord, queryRecord, insertRecord, createDatabase }