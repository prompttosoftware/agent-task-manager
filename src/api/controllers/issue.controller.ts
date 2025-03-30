import { Context, Hono } from 'hono';
import { z } from 'zod';
import { issueService } from '../services/issue.service';
import { Issue } from '../types/issue';
import { Attachment } from '../types/issue';
import { IssueLink } from '../types/issue';

const issueKeySchema = z.string().min(1);
const issueLinkSchema = z.object({
  issueKey: z.string().min(1),
  type: z.string().min(1),
  linkedIssueKey: z.string().min(1)
});

const issueController = {
  async getIssue(c: Context) {
    try {
      const issueKey = issueKeySchema.parse(c.req.param('issueKey'));
      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return c.json({ message: 'Issue not found' }, 404);
      }
      return c.json(issue);
    } catch (error) {
      console.error('Error getting issue:', error);
      if (error instanceof z.ZodError) {
        return c.json({ message: 'Invalid issueKey', errors: error.errors }, 400);
      }
      return c.json({ message: 'Internal server error' }, 500);
    }
  },

  async deleteIssue(c: Context) {
    const issueKey = issueKeySchema.parse(c.req.param('issueKey'));
    try {
      await issueService.deleteIssue(issueKey);
      return c.json({ message: 'Issue deleted successfully' }, 200);
    } catch (error) {
      console.error('Error deleting issue:', error);
      // Consider specific error handling here, e.g., 404 if not found, 403 if forbidden
      return c.json({ message: 'Failed to delete issue' }, 500);
    }
  },
  async addAttachment(c: Context) {
    const issueKey = issueKeySchema.parse(c.req.param('issueKey'));
    try {
      const formData = await c.req.parseBody();
      if (!formData || !formData.file) {
        return c.json({ message: 'No file provided' }, 400);
      }

      const file = formData.file as any;
      const filename = file.filename;
      const buffer = await file.arrayBuffer();

      //File size limit - 10MB
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (buffer.byteLength > MAX_FILE_SIZE) {
          return c.json({ message: 'File size exceeds the limit' }, 400);
      }

      //Allowed file types
      const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return c.json({ message: 'Invalid file type' }, 400);
      }

      //Here goes the implementation of saving the file
      const attachment: Attachment = {
        filename: filename,
        contentType: file.type,
        size: buffer.byteLength,
        data: Buffer.from(buffer).toString('base64') // or store as a file path if needed
      }

      await issueService.addAttachment(issueKey, attachment);

      return c.json({ message: 'Attachment uploaded successfully', attachment: attachment }, 200);
    } catch (error) {
      console.error('Error adding attachment:', error);
      return c.json({ message: 'Failed to upload attachment' }, 500);
    }
  },
  async createIssueLink(c: Context) {
    try {
      const body = await c.req.json();
      const { issueKey, type, linkedIssueKey } = issueLinkSchema.parse(body);

      // Validate issue keys exist (using issueService or a similar method)
      if (!await issueService.issueExists(issueKey)) {
        return c.json({ message: `Issue with key ${issueKey} not found` }, 404);
      }
      if (!await issueService.issueExists(linkedIssueKey)) {
        return c.json({ message: `Issue with key ${linkedIssueKey} not found` }, 404);
      }

      // Implement the logic to create the issue link using issueService
      const issueLink: IssueLink = {
        issueKey,
        type,
        linkedIssueKey
      }
      await issueService.createIssueLink(issueLink);

      return c.json({ message: 'Issue link created successfully', link: { issueKey, type, linkedIssueKey } }, 201);
    } catch (error) {
      console.error('Error creating issue link:', error);
      if (error instanceof z.ZodError) {
        return c.json({ message: 'Invalid request body', errors: error.errors }, 400);
      }
      return c.json({ message: 'Failed to create issue link' }, 500);
    }
  },

  async getIssueCreateMetadata(c: Context) {
    try {
      const projectKeys = c.req.query('projectKeys');
      const issueTypeNames = c.req.query('issueTypeNames');

      const metadata = await issueService.getIssueCreateMetadata(projectKeys ? projectKeys.split(',') : undefined, issueTypeNames ? issueTypeNames.split(',') : undefined);

      return c.json(metadata);
    } catch (error) {
      console.error('Error getting issue create metadata:', error);
      return c.json({ message: 'Failed to retrieve issue create metadata' }, 500);
    }
  },

  async getIssueTransitions(c: Context) {
    try {
      const issueKey = issueKeySchema.parse(c.req.param('issueKey'));

      const transitions = await issueService.getIssueTransitions(issueKey);

      return c.json(transitions);
    } catch (error) {
      console.error('Error getting issue transitions:', error);
      if (error instanceof z.ZodError) {
        return c.json({ message: 'Invalid issueKey', errors: error.errors }, 400);
      }
      return c.json({ message: 'Internal server error' }, 500);
    }
  }
};

export { issueController };