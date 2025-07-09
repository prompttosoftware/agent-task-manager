import { Router } from 'express';
import { MetadataController } from './metadata.controller';

const router = Router();

export default (metadataController: MetadataController) => {
  router.get('/rest/api/2/issue/createmeta', metadataController.getCreateMeta.bind(metadataController));
  return router;
};
