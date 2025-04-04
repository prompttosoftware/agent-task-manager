import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class Board {
  id?: number;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name must be shorter than 255 characters' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
