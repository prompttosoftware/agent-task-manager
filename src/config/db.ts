import sqlite3 from 'sqlite3';

let db: sqlite3.Database | null = null;

export async function getDBConnection(): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db as sqlite3.Database);
        } else {
            db = new sqlite3.Database('./database.db', (err) => {
                if (err) {
                    console.error('Failed to connect to the database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to the database.');
                    resolve(db as sqlite3.Database);
                }
            });
        }
    });
}

export async function closeDBConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Failed to close the database:', err.message);
          reject(err);
        } else {
          console.log('Closed the database connection.');
          db = null; // Reset the db variable after closing
          resolve();
        }
      });
    } else {
      console.log('No database connection to close.');
      resolve();
    }
  });
}