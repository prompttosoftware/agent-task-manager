// src/types/epic.d.ts

export interface Epic {
  epicKey: string;
  name: string;
  description: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
}
