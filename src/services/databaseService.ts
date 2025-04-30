import { IDatabaseConnection } from '../config/db';

export interface DatabaseService {
    connect(db: IDatabaseConnection): Promise<void>;
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

    async connect(db: IDatabaseConnection): Promise<void> {
        this.db = db;
        console.log('DatabaseService connected to the injected database connection.');
    }

    async disconnect(): Promise<void> {
        this.db = null;
        console.log('DatabaseService disconnected from the database.');
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        return new Promise<void>((resolve, reject) => {
            this.db!.run(sql, params, function (err: Error | null) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        return new Promise<T | undefined>((resolve, reject) => {
            this.db!.get<T>(sql, params, (err: Error | null, row: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        return new Promise<T[]>((resolve, reject) => {
            this.db!.all<T>(sql, params, (err: Error | null, rows: T[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        const columnDefinitions = columns.map(col => `${col.column} ${col.type}`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
        await this.run(sql);
    }

    async getSingleValue<T>(tableName: string, key: string): Promise<T | undefined> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        const sql = `SELECT value FROM ${tableName} WHERE key = $1`;
        const result = await this.get<{ value: T }>(sql, [key]);
        if (result) {
            return (result as { value: T }).value;
        }
        return undefined;
    }

    async setSingleValue<T>(tableName: string, key: string, value: T): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }

        // First, try to update the existing row
        let sql = `UPDATE ${tableName} SET value = $1 WHERE key = $2`;
        let params = [value, key];

        await this.run(sql, params);
        const updateResult = await this.get<{ changes: number }>(`SELECT changes() AS changes`);

        if (updateResult === undefined || updateResult.changes === 0) {
            // If no rows were updated, insert a new row
            const insertSql = `INSERT INTO ${tableName} (key, value) VALUES ($1, $2)`;
            const insertParams = [key, value];
            await this.run(insertSql, insertParams);
        }
    }

    async beginTransaction(): Promise<void> {
       if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        await this.run('BEGIN');
    }

    async commitTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        await this.run('COMMIT');
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.db) {
            throw new Error('Database not connected. Inject a database connection.');
        }
        await this.run('ROLLBACK');
    }
}