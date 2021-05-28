import sqlite3m = require('sqlite3');
import path = require('path')
const sqlite3 = sqlite3m.verbose();

const dbPath = path.join(__dirname, '../../temp/db.sqlite')
console.log('dbPath', dbPath)
const db = new sqlite3.Database(dbPath)

// db.serialize(function() {
//   // These two queries will run sequentially.
//   db.run("CREATE TABLE storage (key TEXT PRIMARY KEY, value TEXT)")
//   db.run("INSERT INTO storage VALUES ($key, $value)", { $key: 'k2', $value: 'v2' })
//   db.all("SELECT * from storage", (err, rows) => {
//     console.log('ffff', rows, err)
//   })
// });

export default db
