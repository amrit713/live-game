import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'node:http';
import type { NewMatch } from '@/db/schema.js';

type WsPayload =
    | { type: 'welcome'; message: string }
    | { type: 'matchCreated'; match: NewMatch };

function sendJson(socket: WebSocket, payload: WsPayload) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: WsPayload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server: Server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024, // 1MB
    });

    wss.on('connection', (socket) => {
        sendJson(socket, {
            type: 'welcome',
            message: 'Welcome to the WebSocket server!',
        });

        socket.on('error', console.error);
    });

    function broadcastMatchCreated(match: NewMatch) {
        broadcast(wss, { type: 'matchCreated', match });
    }

    return { broadcastMatchCreated };
}
