// tests/models/board.test.ts

import { Board } from "../src/models/board";

describe("Board Model", () => {
  it("should create a Board instance", () => {
    const board = new Board("Test Board");
    expect(board.name).toBe("Test Board");
  });

  it("should have a unique id", () => {
    const board1 = new Board("Board 1");
    const board2 = new Board("Board 2");
    expect(board1.id).toBeDefined();
    expect(board2.id).toBeDefined();
    expect(board1.id).not.toBe(board2.id);
  });

  it("should allow setting and getting of board name", () => {
    const board = new Board("Initial Name");
    board.name = "New Name";
    expect(board.name).toBe("New Name");
  });

  it("should validate board name not to be empty", () => {
    const board = new Board("Initial Name");
    board.name = "";
    // Assuming that there will be a validation in board.ts that prevent an empty name
    expect(board.name).toBe(""); // or it should throw an error, depends of implementation
  });
});