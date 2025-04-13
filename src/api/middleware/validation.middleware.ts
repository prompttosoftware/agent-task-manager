import { validationResult, checkSchema } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(schema.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array().map(error => error.msg) });
  };
};

export default validate;