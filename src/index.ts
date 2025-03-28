// src/index.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import { Database } from './db';
import { Attachment } from './models/attachment';

const app = express();
const port = 3000;

const db = new Database();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/usr/src/app/attachments'); // Destination folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// Middleware to parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Add attachment endpoint
app.post('/issue/:issueId/attachment', upload.single('file'), async (req, res) => {
  try {
    const issueId = req.params.issueId;
    if (!issueId) {
      return res.status(400).json({ error: 'issueId is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment: Attachment = {
      id: Math.random().toString(36).substring(2, 15),
      issueId: issueId,
      fileName: req.file.originalname,
      filePath: `/usr/src/app/attachments/${req.file.filename}`,
      createdAt: new Date().toISOString(),
    };

    await db.addAttachment(attachment);

    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Error adding attachment:', error);
    res.status(500).json({ error: error.message || 'Failed to add attachment' });
  }
});

// Get attachment metadata endpoint
app.get('/issue/:issueId/attachment/:attachmentId', async (req, res) => {
  try {
    const issueId = req.params.issueId;
    const attachmentId = req.params.attachmentId;

    if (!issueId) {
      return res.status(400).json({ error: 'issueId is required' });
    }
    if (!attachmentId) {
      return res.status(400).json({ error: 'attachmentId is required' });
    }

    const attachment = await db.getAttachment(attachmentId);

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.status(200).json(attachment);
  } catch (error: any) {
    console.error('Error getting attachment metadata:', error);
    res.status(500).json({ error: error.message || 'Failed to get attachment metadata' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
