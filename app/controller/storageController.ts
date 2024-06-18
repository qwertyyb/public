import { app } from 'electron'
import * as path from 'path'
import * as sqlite3m from 'sqlite3'
const sqlite3 = sqlite3m.verbose();

const userDataPath = app.getPath('userData')

const dbPath = path.join(userDataPath, 'db.sqlite')
console.log('dbPath', dbPath)
const db = new sqlite3.Database(dbPath)

export default db
