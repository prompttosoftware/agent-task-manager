const Database = require('better-sqlite3');

const db = new Database('./data/task_manager.db');

function executeQuery(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

function getConnection() {
  return db;
}

// Test function
function testConnection() {
  try {
    executeQuery('SELECT 1');
    console.log('Database connection successful.');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

module.exports = {
  executeQuery,
  getConnection,
  testConnection,
};
