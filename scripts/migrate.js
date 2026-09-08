const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const dbPath = process.env.DATABASE_FILE || './data/app.db';
const schemaPath = path.join(__dirname, '../db/schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log(`Connecting to database at ${dbPath}`);
const db = new Database(dbPath);

console.log(`Reading schema from ${schemaPath}`);
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('Applying schema migrations...');
db.exec(schema);
console.log('Schema migration completed successfully.');

db.close();
