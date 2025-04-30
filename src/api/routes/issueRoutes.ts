import express from 'express';
import { IssueController } from '../controllers/issueController';
import { IssueService } from '../../services/IssueService'; // Import IssueService

const router = express.Router();

// Create a mock IssueService (or import a mock)
const mockIssueService = {
    createIssue: jest.fn(),
    getIssue: jest.fn(),
    updateIssue: jest.fn(),
    deleteIssue: jest.fn(),
};

const issueController = new IssueController(mockIssueService as IssueService); // Instantiate the controller with the mock

router.post('/', issueController.createIssue);
router.get('/:issueIdOrKey', issueController.getIssue);
router.put('/:issueIdOrKey', issueController.updateIssue);
router.delete('/:issueIdOrKey', issueController.deleteIssue);

export default router;