import { Pool } from 'pg';
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
    private pool: Pool | null = null;

    async connect(): Promise<void> {
        try {
            this.pool = new Pool({
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                password: process.env.DB_PASSWORD,
                port: Number(process.env.DB_PORT),
                max: 20, // max number of clients in the pool
                idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
                connectionTimeoutMillis: 2000, // how long to wait for a connection before timing out
            });
            console.log('DatabaseService connected to the database pool.');
        } catch (error) {
            console.error('DatabaseService failed to connect:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('DatabaseService disconnected from the database pool.');
        }
    }

    async run(sql: string, params: any[] = []): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }

        const client = await this.pool.connect();
        try {
            await client.query(sql, params);
        } finally {
            client.release();
        }
    }

    async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }

        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows[0] as T;
        } finally {
            client.release();
        }
    }

    async all<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }

        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            return result.rows as T[];
        } finally {
            client.release();
        }
    }

    async ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const columnDefinitions = columns.map(col => `${col.column} ${col.type}`).join(', ');
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
        await this.run(sql);
    }

    async getSingleValue<T>(tableName: string, key: string): Promise<T | undefined> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const sql = `SELECT value FROM ${tableName} WHERE key = $1`;
        const row = await this.get<{ value: T }>(sql, [key]);
        return row?.value;
    }

    async setSingleValue<T>(tableName: string, key: string, value: T): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }

        // First, try to update the existing row
        let sql = `UPDATE ${tableName} SET value = $1 WHERE key = $2`;
        let params = [value, key];

        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, params);
            if (result.rowCount === 0) {
                // If no rows were updated, insert a new row
                const insertSql = `INSERT INTO ${tableName} (key, value) VALUES ($1, $2)`;
                const insertParams = [key, value];
                await client.query(insertSql, insertParams);
            }
        } finally {
            client.release();
        }
    }

    async beginTransaction(): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
        } finally {
            client.release();
        }
    }

    async commitTransaction(): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const client = await this.pool.connect();
        try {
            await client.query('COMMIT');
        } finally {
            client.release();
        }
    }

    async rollbackTransaction(): Promise<void> {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        const client = await this.pool.connect();
        try {
            await client.query('ROLLBACK');
        } finally {
            client.release();
        }
    }
}