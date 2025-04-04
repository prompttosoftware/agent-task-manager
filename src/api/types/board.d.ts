export interface BoardCreateDto {
  name: string;
  description?: string;
}

export interface BoardUpdateDto {
  name?: string;
  description?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
