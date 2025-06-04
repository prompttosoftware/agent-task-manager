import { Router, type Express } from 'express';
import * as issueController from '../controllers/issueController'; // Adjust path as necessary

/**
 * Sets up the issue-related routes for the Express application.
 * @param app The Express application instance.
 */
const setupIssueRoutes = (app: Express): void => {
  // Create a router instance if needed for middleware or grouping,
  // but for a single route, direct attachment to the app is also fine.
  // Using a base path approach with app.use might be better for a larger API,
  // but the request specifically asks to define the route directly.
  // For simplicity and direct fulfillment of the request:

  app.post('/rest/api/2/issue', issueController.createIssue);

  // If needing a router for future expansion:
  /*
  const router = Router();
  router.post('/issue', issueController.createIssue);
  app.use('/rest/api/2', router); // Mount the router at the base path
  */
};

export default setupIssueRoutes;
