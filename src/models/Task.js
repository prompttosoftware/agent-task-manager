"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = void 0;
const uuid_1 = require("uuid");
const createTask = (title, description, dueDate) => {
    return {
        id: (0, uuid_1.v4)(),
        title,
        description,
        dueDate,
        status: 'open',
    };
};
exports.createTask = createTask;
