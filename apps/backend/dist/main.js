"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = require("./routes/api");
const realtime_1 = require("./realtime");
const db_1 = require("./db");
dotenv_1.default.config({ path: '../../.env' });
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// API Gateway routes
app.use('/api/v1', api_1.apiRouter);
const server = http_1.default.createServer(app);
// Initialize WebSocket gateway
(0, realtime_1.initRealtimeGateway)(server);
// Initialize Neon DB schema if connected
(0, db_1.initDbSchema)();
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`
===========================================================
  🏥 PHARMACEUTICAL COLD-CHAIN BACKEND RUNNING
  📡 HTTP Server:      http://0.0.0.0:${PORT}/api/v1
  ⚡ WebSocket Path:   ws://0.0.0.0:${PORT}/realtime/v1
  🐘 Neon Database:    ${process.env.DATABASE_URL ? 'CONNECTED' : 'IN_MEMORY_MODE'}
===========================================================
  `);
});
