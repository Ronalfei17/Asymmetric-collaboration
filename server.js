import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(express.static("public"));

const rooms = new Map();

function getRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, { headset: null, controllers: new Set() });
  }
  return rooms.get(roomCode);
}

function send(ws, data) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastHeadsetStatus(roomCode) {
  const room = getRoom(roomCode);
  const connected = room.headset !== null && room.headset.readyState === room.headset.OPEN;

  for (const controller of room.controllers) {
    send(controller, {
      type: "headset-status",
      connected
    });
  }
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, "http://localhost");
  const role = url.searchParams.get("role");
  const roomCode = url.searchParams.get("room") || "gp9";

  const room = getRoom(roomCode);
  ws.roomCode = roomCode;
  ws.role = role;
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  if (role === "headset") {
    if (room.headset && room.headset.readyState === room.headset.OPEN) {
      room.headset.close();
    }

    room.headset = ws;
    console.log(`[relay] Headset connected. room=${roomCode}`);
    broadcastHeadsetStatus(roomCode);
  } else {
    room.controllers.add(ws);
    console.log(`[relay] Controller connected. room=${roomCode}`);
    broadcastHeadsetStatus(roomCode);
  }

  ws.on("message", (raw) => {
    let message;

    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (ws.role === "controller" && room.headset) {
      send(room.headset, message);
    }
  });

  ws.on("close", () => {
    if (ws.role === "headset" && room.headset === ws) {
      room.headset = null;
      console.log(`[relay] Headset disconnected. room=${roomCode}`);
    }

    if (ws.role !== "headset") {
      room.controllers.delete(ws);
      console.log(`[relay] Controller disconnected. room=${roomCode}`);
    }

    broadcastHeadsetStatus(roomCode);
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }

    ws.isAlive = false;
    ws.ping();
  }
}, 10000);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`[relay] Server running on port ${port}`);
});