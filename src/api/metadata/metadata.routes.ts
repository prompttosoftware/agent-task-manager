import { Router } from 'express';
import { MetadataController } from './metadata.controller';

const router = Router();

export default (metadataController: MetadataController) => {
  router.get('/issue/createmeta', metadataController.getCreateMeta.bind(metadataController));
  return router;
};
