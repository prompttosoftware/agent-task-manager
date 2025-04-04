import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@nestjs/common';

export const validationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const errorMessages = errors.map(error => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints);
          }
          return error.property;
        }).flat();

        throw new HttpException(errorMessages, 400);
      }

      req.body = dto; // Optionally replace req.body with validated DTO
      next();
    } catch (error: any) {
      const status = error.status || 500;
      const message = error.message || 'Internal server error';
      const errors = error.response?.message || [message];

      res.status(status).json({
        statusCode: status,
        message: errors,
        error: 'Bad Request',
      });
    }
  };
};
