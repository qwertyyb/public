import { app } from 'electron'
import * as path from 'path'
import Database from 'better-sqlite3'
import PouchDB from "pouchdb";

const userDataPath = app.getPath('userData')

const dbPath = path.join(userDataPath, 'db.sqlite')
console.log('dbPath', dbPath)
const db = new Database(dbPath)

const init = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS storage(
    key TEXT UNIQUE NOT NULL,
    value TEXT
  )`)
}

init()

export const pouchDB = new PouchDB("data/publicApp");

export default db
