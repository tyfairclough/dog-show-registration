const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'dogshow.db');
const db = new Database(dbPath);

try {
  db.exec('ALTER TABLE classes ADD COLUMN breed_restriction_mode TEXT NOT NULL DEFAULT "allow"');
  console.log('Column breed_restriction_mode added successfully');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('Column breed_restriction_mode already exists');
  } else {
    console.error('Error:', e.message);
  }
}

db.close();
