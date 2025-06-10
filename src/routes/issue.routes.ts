import { Router, Request, Response, NextFunction } from 'express';
import { createIssue, getIssue, deleteIssue } from '../controllers/issue.controller';
import logger from '../utils/logger';

const router = Router();
// const issueController = new IssueController(); // Remove the instantiation as we're importing functions

// Placeholder for AuthMiddleware - Assuming it will be used for authentication
// import { AuthMiddleware } from '../middleware/auth.middleware';
// const authMiddleware = new AuthMiddleware();

// POST /rest/api/2/issue - Create Issue
router.post('/rest/api/2/issue', /*authMiddleware.authenticate,*/ async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('POST /rest/api/2/issue called');
        await createIssue(req, res, next);
    } catch (error) {
        logger.error('Error creating issue:', error);
        next(error);
    }
});

// GET /rest/api/2/issue/{issueKey} - Get Issue by Key
router.get('/rest/api/2/issue/:issueKey', /*authMiddleware.authenticate,*/ async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('GET /rest/api/2/issue/:issueKey called');
        await getIssue(req, res, next);
    } catch (error) {
        logger.error('Error getting issue:', error);
        next(error);
    }
});

// DELETE /rest/api/2/issue/{issueKey} - Delete Issue by Key
router.delete('/rest/api/2/issue/:issueKey', /*authMiddleware.authenticate,*/ async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.info('DELETE /rest/api/2/issue/:issueKey called');
        await deleteIssue(req, res, next);
    } catch (error) {
        logger.error('Error deleting issue:', error);
        next(error);
    }
});

export { router as issueRoutes };
