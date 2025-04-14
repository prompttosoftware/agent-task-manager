// src/validators/board.validator.ts
import { IsUUID } from 'class-validator';

export class BoardIdParam {
    @IsUUID()
    boardId: string;
}
