const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_FILE || './data/app.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

module.exports = db;
