import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'node:http';
import type { NewMatch } from '@/db/schema.js';

declare global {
    namespace WebSocketCustom {
        interface WebSocket {
            isAlive?: boolean;
        }
    }
}

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

    wss.on('connection', (socket: WebSocket & { isAlive?: boolean }) => {
        socket.isAlive = true;
        socket.on('pong', () => {
            socket.isAlive = true;
        });

        sendJson(socket, {
            type: 'welcome',
            message: 'Welcome to the WebSocket server!',
        });

        socket.on('error', console.error);


    });

    const interval = setInterval(() => {
        wss.clients.forEach((socket: WebSocket & { isAlive?: boolean }) => {
            if (!socket.isAlive) {
                return socket.terminate();
            }
            socket.isAlive = false;
            socket.ping();
        });
    }, 3000);

    wss.on('close', () => {
        clearInterval(interval);
    });


    function broadcastMatchCreated(match: NewMatch) {
        broadcast(wss, { type: 'matchCreated', match });
    }

    return { broadcastMatchCreated };
}
