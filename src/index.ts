import express from "express";
import http from "http";

import { matchesRouter } from "@/routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

app.use(express.json());
app.use("/matches", matchesRouter);

// attach websocket to SAME server
const { broadcastMatchCreated } = attachWebSocketServer(server);

// make it accessible inside routes
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// ✅ start the correct server
server.listen(PORT, HOST, () => {
    const baseUrl =
        HOST === "0.0.0.0"
            ? `http://localhost:${PORT}`
            : `http://${HOST}:${PORT}`;

    console.log(`Server is running at ${baseUrl}`);
    console.log(`WebSocket server is running at ${baseUrl.replace("http", "ws")}/ws`);
});
