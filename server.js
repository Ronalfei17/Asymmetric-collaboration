const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const VERSION = "relay-presence-v3";

const HEADSET_TIMEOUT_MS = 900;
const PRESENCE_CHECK_MS = 100;

const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    headsetTimeoutMs: HEADSET_TIMEOUT_MS,
    presenceCheckMs: PRESENCE_CHECK_MS
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      headset: null,
      headsetOnline: false,
      lastHeadsetSeen: 0,
      controllers: new Set()
    });
  }

  return rooms.get(roomId);
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(payload);
  }
}

function sendJson(ws, obj) {
  send(ws, JSON.stringify(obj));
}

function broadcastHeadsetStatus(room) {
  room.controllers.forEach((controller) => {
    sendJson(controller, {
      type: "headset-status",
      connected: room.headsetOnline
    });
  });
}

function setHeadsetOnline(room, ws, online) {
  if (room.headset !== ws) {
    return;
  }

  const changed = room.headsetOnline !== online;
  room.headsetOnline = online;

  if (online) {
    room.lastHeadsetSeen = Date.now();
  }

  if (changed) {
    broadcastHeadsetStatus(room);
    console.log(`[${VERSION}] headset ${online ? "online" : "offline"}`);
  }
}

function removeHeadset(room, ws) {
  if (room.headset !== ws) {
    return;
  }

  setHeadsetOnline(room, ws, false);
  room.headset = null;
  room.lastHeadsetSeen = 0;
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get("role") || "controller";
  const roomId = url.searchParams.get("room") || "gp9";
  const room = getRoom(roomId);

  ws.role = role;
  ws.roomId = roomId;

  if (role === "headset") {
    if (room.headset && room.headset.readyState === WebSocket.OPEN) {
      try {
        room.headset.terminate();
      } catch {}
    }

    room.headset = ws;
    setHeadsetOnline(room, ws, true);

    sendJson(ws, {
      type: "relay-ready",
      role: "headset",
      room: roomId,
      version: VERSION
    });
  } else {
    room.controllers.add(ws);

    sendJson(ws, {
      type: "relay-ready",
      role: "controller",
      room: roomId,
      version: VERSION
    });

    sendJson(ws, {
      type: "headset-status",
      connected: room.headsetOnline
    });
  }

  ws.on("message", (data) => {
    const message = data.toString();

    let parsed = null;
    try {
      parsed = JSON.parse(message);
    } catch {}

    if (ws.role === "headset") {
      setHeadsetOnline(room, ws, true);

      if (parsed && parsed.type === "heartbeat") {
        return;
      }

      if (parsed && parsed.type === "headset-disconnect") {
        removeHeadset(room, ws);
        return;
      }

      room.controllers.forEach((controller) => {
        send(controller, message);
      });

      return;
    }

    if (ws.role === "controller") {
      if (room.headsetOnline && room.headset && room.headset.readyState === WebSocket.OPEN) {
        send(room.headset, message);
      } else {
        sendJson(ws, {
          type: "headset-status",
          connected: false
        });
      }
    }
  });

  ws.on("close", () => {
    if (ws.role === "controller") {
      room.controllers.delete(ws);
    }

    if (ws.role === "headset") {
      removeHeadset(room, ws);
    }
  });

  ws.on("error", () => {
    if (ws.role === "controller") {
      room.controllers.delete(ws);
    }

    if (ws.role === "headset") {
      removeHeadset(room, ws);
    }
  });
});

setInterval(() => {
  const now = Date.now();

  rooms.forEach((room) => {
    if (!room.headsetOnline || !room.headset) {
      return;
    }

    if (now - room.lastHeadsetSeen > HEADSET_TIMEOUT_MS) {
      const oldHeadset = room.headset;
      removeHeadset(room, oldHeadset);

      try {
        oldHeadset.terminate();
      } catch {}
    }
  });
}, PRESENCE_CHECK_MS);

server.listen(PORT, () => {
  console.log(`[${VERSION}] Relay server running on port ${PORT}`);
});
