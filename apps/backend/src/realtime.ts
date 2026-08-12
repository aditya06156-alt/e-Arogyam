import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WsEventMap } from './types';

let io: SocketIOServer | null = null;
let sequenceCounter = 0;

export function initRealtimeGateway(server: HttpServer) {
  io = new SocketIOServer(server, {
    path: '/realtime/v1',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    socket.on('join.facility', (facilityId: string) => {
      socket.join(`facility:${facilityId}`);
    });

    socket.on('join.batch', (batchId: string) => {
      socket.join(`batch:${batchId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
    });
  });

  console.log('✅ Socket.io WebSocket Gateway running on path /realtime/v1');
}

export function broadcastWsEvent<K extends keyof WsEventMap>(event: K, data: WsEventMap[K]) {
  if (!io) return;
  sequenceCounter++;
  const payload = {
    event,
    eventId: `evt-${Date.now()}-${sequenceCounter}`,
    sequenceNumber: sequenceCounter,
    timestamp: new Date().toISOString(),
    data
  };

  io.emit(event, payload);
  console.log(`📡 Broadcast WS event: [${event}]`, data);
}
