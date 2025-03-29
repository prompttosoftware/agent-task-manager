// src/api/services/issue.service.ts

import db from '../db/database';
import { WebhookService } from './webhook.service';
import { WebhookPayload } from '../types/webhook.d';
import { getWebhook } from './webhook.service';

// Instantiate WebhookService - ideally, this would be dependency injected
const webhookService = new WebhookService(db);

export interface TransitionRequest {
  transitionId: string; // Or use a more descriptive type if you have transition names
}

export async function createIssue(issueData: any): Promise<any> {
  const start = Date.now();
  let issue: any;
  try {
    db.exec('BEGIN TRANSACTION');
    const stmt = db.prepare('INSERT INTO issues (summary, description, status) VALUES (?, ?, ?)');
    const info = stmt.run(issueData.summary, issueData.description, issueData.status);
    issue = { id: info.lastInsertRowid, ...issueData };
    console.log("Issue created", info.lastInsertRowid);
    await triggerIssueEvent('issue.created', issue);
    db.exec('COMMIT');
    const end = Date.now();
    console.log(`createIssue (service) took ${end - start}ms`);
    return issue;
  } catch (error) {
    const end = Date.now();
    console.log(`createIssue (service) took ${end - start}ms`);
    console.error("Error creating issue:", error);
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function getIssue(issueId: number): Promise<any> {
    const start = Date.now();
  try {
    const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(issueId);
    const end = Date.now();
    console.log(`getIssue (service) took ${end - start}ms`);
    return row;
  } catch (error) {
      const end = Date.now();
      console.log(`getIssue (service) took ${end - start}ms`);
    console.error("Error getting issue:", error);
    throw error;
  }
}

export async function updateIssue(issueId: number, updateData: any): Promise<any> {
    const start = Date.now();
  try {
    db.exec('BEGIN TRANSACTION');
    // Build the SET part of the SQL query dynamically
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    values.push(issueId);

    const sql = `UPDATE issues SET ${setClauses} WHERE id = ?`;
    const stmt = db.prepare(sql);
    const info = stmt.run(...values);
    console.log("Issue updated", info.changes);
    const issue = { id: issueId, ...updateData };
    await triggerIssueEvent('issue.updated', issue);
    db.exec('COMMIT');
      const end = Date.now();
      console.log(`updateIssue (service) took ${end - start}ms`);
    return { changes: info.changes };
  } catch (error) {
      const end = Date.now();
      console.log(`updateIssue (service) took ${end - start}ms`);
    console.error("Error updating issue:", error);
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function deleteIssue(issueId: number): Promise<void> {
    const start = Date.now();
  try {
    db.exec('BEGIN TRANSACTION');
    const stmt = db.prepare('DELETE FROM issues WHERE id = ?');
    stmt.run(issueId);
    console.log("Issue deleted");
    await triggerIssueEvent('issue.deleted', { id: issueId });
    db.exec('COMMIT');
      const end = Date.now();
      console.log(`deleteIssue (service) took ${end - start}ms`);
  } catch (error) {
      const end = Date.now();
      console.log(`deleteIssue (service) took ${end - start}ms`);
    console.error("Error deleting issue:", error);
    db.exec('ROLLBACK');
    throw error;
  }
}

export async function transitionIssue(issueKey: string, transitionData: TransitionRequest): Promise<any> {
  // In a real-world scenario, you would fetch the issue from your database or Jira.
  const issueId = parseInt(issueKey, 10);
  if (isNaN(issueId)) {
    throw new Error('Invalid issue key format.');
  }
  const issue = await getIssue(issueId);

  if (!issue) {
    throw new Error('Issue not found.');
  }

  try {
    // Implement your transition logic here
    // Validate transitionData (e.g., transitionId)
    if (!transitionData.transitionId) {
      throw new Error('Transition ID is required.');
    }

    // In a real implementation, you would use the transitionId and issue details
    // to update the issue's status in your database or Jira.
    // For this example, we'll just simulate the transition by updating the status.
    let newStatus: string;
    switch (transitionData.transitionId) {
        case '1': // Assuming '1' represents 'To Do' -> 'In Progress'
            newStatus = 'In Progress';
            break;
        case '2': // Assuming '2' represents 'In Progress' -> 'Done'
            newStatus = 'Done';
            break;
        default:
            throw new Error('Invalid transition ID.');
    }

    await updateIssue(issueId, { status: newStatus });

    return { message: `Issue ${issueKey} transitioned to ${newStatus}` };
  } catch (error: any) {
    console.error("Error transitioning issue:", error);
    throw new Error(`Failed to transition issue: ${error.message}`);
  }
}

async function triggerIssueEvent(event: string, data: any) {
    const webhooks = await listWebhooksForEvent(event);

    for (const webhook of webhooks) {
        const payload: WebhookPayload = {
            event: event,
            data: data,
            timestamp: new Date().toISOString(),
            webhookId: webhook.id,
        };
        try {
            await webhookService.addWebhookPayloadToQueue(webhook.id, payload);
        } catch (error) {
            console.error(`Error triggering ${event} event for webhook ${webhook.id}:`, error);
            // Consider more sophisticated error handling, e.g., retry mechanism or dead-letter queue
        }
    }
}


async function listWebhooksForEvent(event: string) {
    // Fetch all active webhooks and filter by the event
    const allWebhooks = await webhookService.listWebhooks();
    return allWebhooks.filter(webhook => webhook.events.includes(event));
}
