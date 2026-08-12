import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes/api';
import { initRealtimeGateway } from './realtime';
import { initDbSchema } from './db';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Gateway routes
app.use('/api/v1', apiRouter);

const server = http.createServer(app);

// Initialize WebSocket gateway
initRealtimeGateway(server);

// Initialize Neon DB schema if connected
initDbSchema();

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
