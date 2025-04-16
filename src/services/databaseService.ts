import { Database, OPEN_READWRITE, OPEN_CREATE } from 'sqlite3';
import { getDBConnection } from '../config/db';

export class DatabaseService {
  private db: Database | null = null;

  async connect(): Promise<void> {
    try {
      this.db = await getDBConnection();
      console.log('DatabaseService connected to the database.');
    } catch (error) {
      console.error('DatabaseService failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            console.error('DatabaseService failed to disconnect:', err);
            reject(err);
          } else {
            this.db = null;
            console.log('DatabaseService disconnected from the database.');
            resolve();
          }
        });
      });
    }
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return new Promise<void>((resolve, reject) => {
      this.db!.run(sql, params, function(err: Error | null) {
        if (err) {
          console.error(`DatabaseService run failed for SQL: ${sql}`, err);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return new Promise<T | undefined>((resolve, reject) => {
      this.db!.get(sql, params, (err: Error | null, row: T) => {
        if (err) {
          console.error(`DatabaseService get failed for SQL: ${sql}`, err);
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return new Promise<T[]>((resolve, reject) => {
      this.db!.all(sql, params, (err: Error | null, rows: T[]) => {
        if (err) {
          console.error(`DatabaseService all failed for SQL: ${sql}`, err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }
}