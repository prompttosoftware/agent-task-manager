import express from 'express';
import { EpicController } from '../controllers/epicController';

const router = express.Router();

export default (epicController: EpicController) => {
  // Use controller methods bound to the controller instance
  router.get('/', epicController.getEpics.bind(epicController));
  router.post('/', epicController.createEpic.bind(epicController));

  return router;
};
