import express from 'express';
import bodyParser from 'body-parser';
import { issueRoutes } from './api/routes/issueRoutes';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use('/rest/api/2', issueRoutes);

app.listen(port, () => {
  console.log(\`Server is running on port \${port}\`);
});

export default app;
