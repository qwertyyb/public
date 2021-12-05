import db from './dbController'
import { formatDate } from '../utils'

const dbExec = (api: string) => (sql: string, params: string[] = []) => {
  return new Promise((resolve, reject) => db[api](sql, params, (err: Error | null, res: any) => {
    console.log(sql, params, err, res)
    if (err) return reject(err)
    resolve(res)
  }))
}
const dbRun = dbExec('run')
const dbGet = dbExec('get')

// @todo tableName应该加上插件唯一标识，否则会冲突，建议在manager处理
const createTable = (tableName, columnsDef) => {
  /**
   * CREATE TABLE IF NOT EXISTS settings (
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
   */
  const sql = `create table IF NOT EXISTS ${tableName} (${columnsDef})`
  return new Promise((resolve, reject) => db.run(sql, (err, res) => {
    if (err) return reject(err)
    resolve(res)
  }))
}

createTable('storage', `
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
`)

console.log('formatDate', formatDate)

const setItem = (key: string, value: string) => {
  console.log('setItem', key, value)
  const sql = `INSERT OR REPLACE INTO storage(key, value, createdAt, updatedAt) values(?, ?, ?, ?)`
  return dbRun(
    sql,
    [
      key, value, formatDate(new Date()), formatDate(new Date()),
    ])
}

const removeItem = (key: string) => {
  const sql = `delete from storage where key = ?`
  return dbRun(sql, [key])
}

const getItem = (key: string) => {
  const sql = `select value from storage where key = ?`
  return dbGet(sql, [key]).then((res: any) => res?.value)
}

const clear = (prefix: string) => {
  const sql = `delete from storage where key like ?`
  return dbRun(sql, [prefix + '%'])
}

export { removeItem, getItem, setItem, clear }
