import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        const errorMessages = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
        }));
        return res.status(400).json({ errors: errorMessages });
      }
      req.body = dto; // Replace req.body with validated DTO
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      next(error);
    }
  };
};
