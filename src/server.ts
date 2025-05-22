import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import apiRouter from './api/index';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jira Clone API',
      version: '1.0.0',
    },
  },
  apis: ['./src/api/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(options);

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
