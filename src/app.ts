import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
 res.send('Hello World!');
});

app.listen(port, () => {
 console.log(`Server is running on port ${port}`);
});

export default app;
