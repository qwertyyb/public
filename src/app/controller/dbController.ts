import { app } from 'electron'
import sqlite3m = require('sqlite3');
import path = require('path')
const sqlite3 = sqlite3m.verbose();

const userDataPath = app.getPath('userData')

const dbPath = path.join(userDataPath, 'db.sqlite')
console.log('dbPath', dbPath)
const db = new sqlite3.Database(dbPath)

export default db