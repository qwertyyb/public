import { app } from 'electron'
import * as path from 'path'
import Database from 'better-sqlite3'

const userDataPath = app.getPath('userData')

const dbPath = path.join(userDataPath, 'db.sqlite')
console.log('dbPath', dbPath)
const db = new Database(dbPath)

export default db
