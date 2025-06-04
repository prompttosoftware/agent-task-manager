import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/rest/api/2/issue', (req, res) => {
  // In a real application, you'd handle issue creation logic here
  // For now, we'll just return a success message
  res.status(200).json({ message: 'Issue created successfully' });
});

export default router;
