const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      headset: null,
      controllers: new Set()
    });
  }

  return rooms.get(roomId);
}

function send(ws, payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(payload);
}

function sendJson(ws, obj) {
  send(ws, JSON.stringify(obj));
}

function broadcastHeadsetStatus(room, connected) {
  room.controllers.forEach((controller) => {
    sendJson(controller, {
      type: "headset-status",
      connected
    });
  });
}

function disconnectHeadset(room, ws) {
  if (room.headset !== ws) {
    return;
  }

  room.headset = null;
  broadcastHeadsetStatus(room, false);
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get("role") || "controller";
  const roomId = url.searchParams.get("room") || "gp9";
  const room = getRoom(roomId);

  ws.role = role;
  ws.roomId = roomId;
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  if (role === "headset") {
    if (room.headset && room.headset.readyState === WebSocket.OPEN) {
      try {
        room.headset.close();
      } catch {}
    }

    room.headset = ws;
    broadcastHeadsetStatus(room, true);

    sendJson(ws, {
      type: "relay-ready",
      role: "headset",
      room: roomId
    });
  } else {
    room.controllers.add(ws);

    sendJson(ws, {
      type: "relay-ready",
      role: "controller",
      room: roomId
    });

    sendJson(ws, {
      type: "headset-status",
      connected: !!room.headset && room.headset.readyState === WebSocket.OPEN
    });
  }

  ws.on("message", (data) => {
    const message = data.toString();

    let parsed = null;
    try {
      parsed = JSON.parse(message);
    } catch {}

    if (ws.role === "headset" && parsed && parsed.type === "headset-disconnect") {
      disconnectHeadset(room, ws);
      return;
    }

    if (ws.role === "controller") {
      if (room.headset && room.headset.readyState === WebSocket.OPEN) {
        send(room.headset, message);
      } else {
        sendJson(ws, {
          type: "headset-status",
          connected: false
        });
      }

      return;
    }

    if (ws.role === "headset") {
      room.controllers.forEach((controller) => {
        send(controller, message);
      });
    }
  });

  ws.on("close", () => {
    if (ws.role === "controller") {
      room.controllers.delete(ws);
      return;
    }

    if (ws.role === "headset") {
      disconnectHeadset(room, ws);
    }
  });

  ws.on("error", () => {
    if (ws.role === "headset") {
      disconnectHeadset(room, ws);
    }

    if (ws.role === "controller") {
      room.controllers.delete(ws);
    }
  });
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      const room = getRoom(ws.roomId);

      if (ws.role === "headset") {
        disconnectHeadset(room, ws);
      }

      if (ws.role === "controller") {
        room.controllers.delete(ws);
      }

      try {
        ws.terminate();
      } catch {}

      return;
    }

    ws.isAlive = false;

    try {
      ws.ping();
    } catch {}
  });
}, 1000);

server.listen(PORT, () => {
  console.log(`Relay server running on port ${PORT}`);
});
