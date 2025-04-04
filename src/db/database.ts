import Database from 'better-sqlite3';
import fs from 'fs';

const dbFilePath = './data/task_manager.db';

// Ensure the data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

const db = new Database(dbFilePath, { verbose: console.log });

// Read the schema from epic1_database_setup.txt and execute it
try {
  const schema = fs.readFileSync('epic1_database_setup.txt', 'utf8');
  db.exec(schema);
  console.log('Database schema created successfully.');
} catch (error) {
  console.error('Error creating database schema:', error);
}

export default db;
