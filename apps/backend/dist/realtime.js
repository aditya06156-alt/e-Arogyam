"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRealtimeGateway = initRealtimeGateway;
exports.broadcastWsEvent = broadcastWsEvent;
const socket_io_1 = require("socket.io");
let io = null;
let sequenceCounter = 0;
function initRealtimeGateway(server) {
    io = new socket_io_1.Server(server, {
        path: '/realtime/v1',
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log(`⚡ WebSocket client connected: ${socket.id}`);
        socket.on('join.facility', (facilityId) => {
            socket.join(`facility:${facilityId}`);
        });
        socket.on('join.batch', (batchId) => {
            socket.join(`batch:${batchId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
        });
    });
    console.log('✅ Socket.io WebSocket Gateway running on path /realtime/v1');
}
function broadcastWsEvent(event, data) {
    if (!io)
        return;
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
