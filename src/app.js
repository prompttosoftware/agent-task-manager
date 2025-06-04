"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
/**
 * Creates an Express application instance.
 * This instance can be used to define routes, middleware, and start the server.
 */
const app = (0, express_1.default)();
exports.app = app;
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
