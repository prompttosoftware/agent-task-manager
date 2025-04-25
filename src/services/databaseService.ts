import { Database, OPEN_READWRITE, OPEN_CREATE } from 'sqlite3';
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
    private db: sqlite3.Database | null = null;

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
            this.db!.run(sql, params, function (err: Error | null) {
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

        return new Promise<void>((resolve, reject) => {
            this.db!.run(sql, params, (err: Error | null) => {
                if (err) {
                    console.error(`DatabaseService run failed for SQL: ${sql}`, err);
                    reject(err);
                    return;
                }

                // Check the number of rows affected using 'this.changes'
                if ((this as any).changes === 0) {
                    // If no rows were updated, insert a new row
                    const insertSql = `INSERT INTO ${tableName} (key, value) VALUES (?, ?)`;
                    const insertParams = [key, value];

                    this.db!.run(insertSql, insertParams, (err: Error | null) => {
                        if (err) {
                            console.error(`DatabaseService run failed for SQL: ${insertSql}`, err);
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
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
