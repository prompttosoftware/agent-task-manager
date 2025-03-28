// src/index.ts
import express from 'express';
import { Database } from './db';
import { Attachment } from './models/attachment';

const app = express();
const port = 3000;

const db = new Database();

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Add attachment endpoint
app.post('/attachments', async (req, res) => {
  // In a real application, you'd handle file uploads here.
  // For this example, we'll just create a placeholder attachment.
  try {
    const { issueId, fileName, filePath } = req.body;
    if (!issueId || !fileName || !filePath) {
      return res.status(400).json({ error: 'issueId, fileName, and filePath are required' });
    }

    const attachment: Attachment = {
      id: Math.random().toString(36).substring(2, 15),
      issueId,
      fileName,
      filePath,
      createdAt: new Date().toISOString(),
    };

    await db.addAttachment(attachment);

    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ error: error.message || 'Failed to add attachment' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});