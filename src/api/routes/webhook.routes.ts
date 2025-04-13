import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  // TODO: Implement webhook handling
  res.status(200).send('Webhook received');
});

export default router;
