// src/index.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import { Database } from './db';
import { Attachment } from './models/attachment';
import { Issue } from './models/Issue';

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

// Get Issues for Board endpoint
app.get('/board/:boardName/issues', async (req, res) => {
  try {
    const boardName = req.params.boardName;

    if (!boardName) {
      return res.status(400).json({ error: 'boardName is required' });
    }

    // Fetch issues from SQLite database associated with the board name
    // Assuming you have a way to link issues to boards via a 'statusCategory' field
    //  For example, 'To Do', 'In Progress', 'Done' will be the board names
    const issues = await db.getIssuesByStatusCategory(boardName);

    // Return Jira-like JSON response
    const jiraIssues = issues.map(issue => {
      let statusName: string = boardName;
      if (boardName === 'To Do') {
        statusName = 'open (11)';
      } else if (boardName === 'In Progress') {
        statusName = 'indeterminate (21)';
      } else if (boardName === 'Done') {
        statusName = 'done (31)';
      }

      return {
        id: issue.id,
        key: `ATM-${issue.id}`,
        fields: {
          summary: issue.summary,
          status: {
            name: statusName // Changed to reflect the mapping
          },
          // Add other fields as needed, e.g., priority, issue type, etc.
        }
      }
    });

    res.status(200).json(jiraIssues);

  } catch (error: any) {
    console.error('Error getting issues for board:', error);
    res.status(500).json({ error: error.message || 'Failed to get issues for board' });
  }
});

// Create Issue endpoint
app.post('/issue', async (req, res) => {
  try {
    const { summary, statusCategory } = req.body;

    if (!summary) {
      return res.status(400).json({ error: 'Summary is required' });
    }
    if (!statusCategory) {
      return res.status(400).json({ error: 'statusCategory is required' });
    }

    const newIssue: Issue = {
      id: Math.floor(Math.random() * 10000).toString(), // Generate a random id
      summary: summary,
      statusCategory: statusCategory,
    };

    await db.addIssue(newIssue);

    res.status(201).json(newIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message || 'Failed to create issue' });
  }
});

// Get Epics endpoint
app.get('/epics', async (req, res) => {
  try {
    // Assuming you have a method in your db class to retrieve epics
    const epics = await db.getEpics();

    // Format the epics as needed (Jira-like format)
    const jiraEpics = epics.map(epic => ({
      id: epic.id,
      key: `ATM-${epic.id}`,
      fields: {
        summary: epic.summary,
        // Add other relevant fields
      }
    }));

    res.status(200).json(jiraEpics);
  } catch (error: any) {
    console.error('Error getting epics:', error);
    res.status(500).json({ error: error.message || 'Failed to get epics' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
