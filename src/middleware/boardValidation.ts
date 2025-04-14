import { Request, Response, NextFunction } from 'express';

export const boardValidator = (req: Request, res: Response, next: NextFunction) => {
  const { boardId } = req.params;

  if (!boardId || typeof boardId !== 'string') {
    return res.status(400).json({ message: 'Invalid boardId' });
  }

  // Add more validation logic here if needed, e.g., check for valid format

  next();
};
