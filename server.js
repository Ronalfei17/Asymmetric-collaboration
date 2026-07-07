const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const VERSION = "relay-webrtc-v4";

const HEADSET_TIMEOUT_MS = 2200;
const PRESENCE_CHECK_MS = 100;

const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    headsetTimeoutMs: HEADSET_TIMEOUT_MS,
    presenceCheckMs: PRESENCE_CHECK_MS,
    rooms: rooms.size
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      headset: null,
      streamer: null,
      lastHeadsetSeen: 0,
      publishedHeadsetOnline: false,
      controllers: new Set(),
      viewers: new Set(),
      viewersByConnectionId: new Map()
    });
  }

  return rooms.get(roomId);
}

function isOpen(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
}

function send(ws, payload) {
  if (isOpen(ws)) {
    ws.send(payload);
  }
}

function sendJson(ws, obj) {
  send(ws, JSON.stringify(obj));
}

function closeQuietly(ws) {
  try {
    if (ws) {
      ws.terminate();
    }
  } catch {}
}

function isPresenceOnline(room) {
  return isOpen(room.headset) && Date.now() - room.lastHeadsetSeen <= HEADSET_TIMEOUT_MS;
}

function isStreamerOnline(room) {
  return isOpen(room.streamer);
}

function isHeadsetAvailable(room) {
  return isPresenceOnline(room) || isStreamerOnline(room);
}

function broadcastHeadsetStatus(room, force = false) {
  const connected = isHeadsetAvailable(room);

  if (!force && room.publishedHeadsetOnline === connected) {
    return;
  }

  room.publishedHeadsetOnline = connected;

  const payload = {
    type: "headset-status",
    connected
  };

  room.controllers.forEach((controller) => sendJson(controller, payload));
  room.viewers.forEach((viewer) => sendJson(viewer, payload));

  console.log(`[${VERSION}] headset ${connected ? "online" : "offline"}`);
}

function broadcastStreamStatus(room) {
  const payload = {
    type: "stream-status",
    connected: isStreamerOnline(room)
  };

  room.viewers.forEach((viewer) => sendJson(viewer, payload));
}

function removeHeadset(room, ws) {
  if (room.headset !== ws) {
    return;
  }

  room.headset = null;
  room.lastHeadsetSeen = 0;
  broadcastHeadsetStatus(room);
}

function removeStreamer(room, ws) {
  if (room.streamer !== ws) {
    return;
  }

  room.streamer = null;
  broadcastStreamStatus(room);
  broadcastHeadsetStatus(room);
}

function getConnectionId(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  if (typeof parsed.from === "string" && parsed.from.length > 0) {
    return parsed.from;
  }

  if (typeof parsed.connectionId === "string" && parsed.connectionId.length > 0) {
    return parsed.connectionId;
  }

  if (parsed.data && typeof parsed.data.connectionId === "string" && parsed.data.connectionId.length > 0) {
    return parsed.data.connectionId;
  }

  return null;
}

function registerViewerConnection(room, ws, connectionId) {
  if (!connectionId) {
    return;
  }

  ws.connectionIds.add(connectionId);
  room.viewersByConnectionId.set(connectionId, ws);
}

function notifyStreamerDisconnect(room, connectionId) {
  if (!connectionId || !isStreamerOnline(room)) {
    return;
  }

  sendJson(room.streamer, {
    type: "disconnect",
    connectionId
  });
}

function unregisterViewer(room, ws) {
  if (!room.viewers.has(ws)) {
    return;
  }

  room.viewers.delete(ws);

  ws.connectionIds.forEach((connectionId) => {
    if (room.viewersByConnectionId.get(connectionId) === ws) {
      room.viewersByConnectionId.delete(connectionId);
      notifyStreamerDisconnect(room, connectionId);
    }
  });

  ws.connectionIds.clear();
}

function parseJson(message) {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

function routeStreamerMessage(room, message, parsed) {
  const connectionId = getConnectionId(parsed);

  if (connectionId) {
    const viewer = room.viewersByConnectionId.get(connectionId);

    if (isOpen(viewer)) {
      send(viewer, message);
      return;
    }
  }

  room.viewers.forEach((viewer) => send(viewer, message));
}

function routeViewerMessage(room, ws, message, parsed) {
  const connectionId = getConnectionId(parsed);
  registerViewerConnection(room, ws, connectionId);

  if (!isStreamerOnline(room)) {
    sendJson(ws, {
      type: "stream-status",
      connected: false
    });
    return;
  }

  send(room.streamer, message);
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get("role") || "controller";
  const roomId = url.searchParams.get("room") || "gp9";
  const room = getRoom(roomId);

  ws.role = role;
  ws.roomId = roomId;
  ws.connectionIds = new Set();

  if (role === "headset") {
    if (isOpen(room.headset)) {
      closeQuietly(room.headset);
    }

    room.headset = ws;
    room.lastHeadsetSeen = Date.now();

    sendJson(ws, {
      type: "relay-ready",
      role: "headset",
      room: roomId,
      version: VERSION
    });

    broadcastHeadsetStatus(room);
  } else if (role === "streamer") {
    if (isOpen(room.streamer)) {
      closeQuietly(room.streamer);
    }

    room.streamer = ws;

    sendJson(ws, {
      type: "relay-ready",
      role: "streamer",
      room: roomId,
      version: VERSION
    });

    broadcastStreamStatus(room);
    broadcastHeadsetStatus(room);
  } else if (role === "viewer") {
    room.viewers.add(ws);

    sendJson(ws, {
      type: "relay-ready",
      role: "viewer",
      room: roomId,
      version: VERSION
    });

    sendJson(ws, {
      type: "headset-status",
      connected: isHeadsetAvailable(room)
    });

    sendJson(ws, {
      type: "stream-status",
      connected: isStreamerOnline(room)
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
      connected: isHeadsetAvailable(room)
    });
  }

  ws.on("message", (data) => {
    const message = data.toString();
    const parsed = parseJson(message);

    if (ws.role === "headset") {
      room.lastHeadsetSeen = Date.now();
      broadcastHeadsetStatus(room);

      if (parsed && parsed.type === "heartbeat") {
        return;
      }

      if (parsed && parsed.type === "headset-disconnect") {
        removeHeadset(room, ws);
        return;
      }

      room.controllers.forEach((controller) => send(controller, message));
      return;
    }

    if (ws.role === "streamer") {
      if (parsed && parsed.type === "heartbeat") {
        return;
      }

      if (parsed && parsed.type === "streamer-disconnect") {
        removeStreamer(room, ws);
        return;
      }

      routeStreamerMessage(room, message, parsed);
      return;
    }

    if (ws.role === "viewer") {
      if (!parsed) {
        sendJson(ws, {
          type: "error",
          message: "Viewer messages must be JSON."
        });
        return;
      }

      routeViewerMessage(room, ws, message, parsed);
      return;
    }

    if (ws.role === "controller") {
      if (isOpen(room.headset)) {
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

    if (ws.role === "viewer") {
      unregisterViewer(room, ws);
    }

    if (ws.role === "headset") {
      removeHeadset(room, ws);
    }

    if (ws.role === "streamer") {
      removeStreamer(room, ws);
    }
  });

  ws.on("error", () => {
    if (ws.role === "controller") {
      room.controllers.delete(ws);
    }

    if (ws.role === "viewer") {
      unregisterViewer(room, ws);
    }

    if (ws.role === "headset") {
      removeHeadset(room, ws);
    }

    if (ws.role === "streamer") {
      removeStreamer(room, ws);
    }
  });
});

setInterval(() => {
  const now = Date.now();

  rooms.forEach((room) => {
    if (!room.headset) {
      return;
    }

    if (now - room.lastHeadsetSeen > HEADSET_TIMEOUT_MS) {
      const oldHeadset = room.headset;
      removeHeadset(room, oldHeadset);
      closeQuietly(oldHeadset);
    }
  });
}, PRESENCE_CHECK_MS);

server.listen(PORT, () => {
  console.log(`[${VERSION}] Relay server running on port ${PORT}`);
});
