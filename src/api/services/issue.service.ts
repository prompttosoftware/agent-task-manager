// src/api/services/issue.service.ts

import db from '../db/database';

export async function createIssue(issueData: any): Promise<any> {
  try {
    const stmt = db.prepare('INSERT INTO issues (summary, description, status) VALUES (?, ?, ?)');
    const info = stmt.run(issueData.summary, issueData.description, issueData.status);
    console.log("Issue created", info.lastInsertRowid);
    return { id: info.lastInsertRowid, ...issueData };
  } catch (error) {
    console.error("Error creating issue:", error);
    throw error;
  }
}

export async function getIssue(issueId: number): Promise<any> {
    try {
        const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
        const row = stmt.get(issueId);
        return row;
    } catch (error) {
        console.error("Error getting issue:", error);
        throw error;
    }
}

export async function updateIssue(issueId: number, updateData: any): Promise<any> {
    try {
        // Build the SET part of the SQL query dynamically
        const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);
        values.push(issueId);

        const sql = `UPDATE issues SET ${setClauses} WHERE id = ?`;
        const stmt = db.prepare(sql);
        const info = stmt.run(...values);
        console.log("Issue updated", info.changes);
        return { changes: info.changes };
    } catch (error) {
        console.error("Error updating issue:", error);
        throw error;
    }
}

export async function deleteIssue(issueId: number): Promise<void> {
    try {
        const stmt = db.prepare('DELETE FROM issues WHERE id = ?');
        stmt.run(issueId);
        console.log("Issue deleted");
    } catch (error) {
        console.error("Error deleting issue:", error);
        throw error;
    }
}
