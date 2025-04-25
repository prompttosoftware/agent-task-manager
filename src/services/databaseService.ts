import { IDatabaseConnection } from '../config/db';
import { getDBConnection } from '../config/db';
import sqlite3 from 'sqlite3';

export interface DatabaseService {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    run(sql: string, params?: any[]): Promise<void>;
    get<T>(sql: string, params?: any[]): Promise<T | undefined>;
    all<T>(sql: string, params?: any[]): Promise<T[]>;
    ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void>;
    getSingleValue<T>(tableName: string, key: string): Promise<T | undefined>;
    setSingleValue<T>(tableName: string, key: string, value: T): Promise<void>;
    beginTransaction(): Promise<void>;
    commitTransaction(): Promise<void>;
    rollbackTransaction(): Promise<void>;
}

export class DatabaseService implements DatabaseService {
    private db: IDatabaseConnection | null = null;

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
            await this.db.close();
            this.db = null;
            console.log('DatabaseService disconnected from the database.');
        }
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        await this.db.run(sql, params);
    }

    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db.get<T>(sql, params);
    }

    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db.all<T>(sql, params);
    }

    async ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const columnDefinitions = columns.map(col => `${col.column} ${col.type}`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
        await this.run(sql);
    }

    async getSingleValue<T>(tableName: string, key: string): Promise<T | undefined> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const sql = `SELECT value FROM ${tableName} WHERE key = ?`;
        const row = await this.get<{ value: T }>(sql, [key]);
        return row?.value;
    }

    async setSingleValue<T>(tableName: string, key: string, value: T): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        // First, try to update the existing row
        let sql = `UPDATE ${tableName} SET value = ? WHERE key = ?`;
        let params = [value, key];

        // Custom implementation to handle changes
        const changes = await this.run(sql, params);
        if (changes === undefined || changes === null) {
          // If no rows were updated, insert a new row
          const insertSql = `INSERT INTO ${tableName} (key, value) VALUES (?, ?)`;
          const insertParams = [key, value];
          await this.run(insertSql, insertParams);
        }
    }

    async beginTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        await this.run('BEGIN TRANSACTION');
    }

    async commitTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        await this.run('COMMIT TRANSACTION');
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        await this.run('ROLLBACK TRANSACTION');
    }
}