import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'node:http';
import type { NewMatch } from '@/db/schema.js';
import { wsArcjet } from '@/arcject.js';
import type { Request } from 'express';

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

    wss.on('connection', async (socket: WebSocket & { isAlive?: boolean }, req: Request) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req)

                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;
                    const reasion = decision.reason.isRateLimit() ? 'Too many requests' : 'access denied';
                    socket.close(code, reasion);
                }
            } catch (error) {
                console.error('Error in Arcjet WebSocket protection:', error);
                socket.close(1011, 'Server security error');
                return;
            }
        }

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
