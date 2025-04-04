import { IsString, IsNotEmpty } from 'class-validator';

export class Board {
  id?: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  description?: string;
}
