// src/models/board.ts

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  labels: Label[];
  // Add other board properties here
}
