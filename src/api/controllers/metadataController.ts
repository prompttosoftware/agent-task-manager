import { Request, Response, NextFunction, Router } from 'express';

const getCreateMetadata = (req: Request, res: Response, next: NextFunction) => {
  try {
    const metadata = {
      projects: [
        {
          id: '10000',
          name: 'My Project',
          issuetypes: [
            {
              id: '10001',
              name: 'Task',
              subtask: false
            },
            {
              id: '10002',
              name: 'Subtask',
              subtask: true
            },
            {
              id: '10003',
              name: 'Story',
              subtask: false
            },
            {
              id: '10004',
              name: 'Bug',
              subtask: false
            },
            {
              id: '10005',
              name: 'Epic',
              subtask: false
            }
          ]
        }
      ]
    };

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(metadata);
  } catch (error: any) {
    console.error('Error creating metadata:', error);
    res.status(500).json({ error: 'Failed to create metadata' });
  }
};

export { getCreateMetadata };
