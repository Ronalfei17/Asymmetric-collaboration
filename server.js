const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

const PORT = process.env.PORT || 3000;
const VERSION = "relay-webrtc-v7-dmx-range-agent";

const DMX_BRIDGE_PORT = Number(process.env.DMX_BRIDGE_PORT || 31808);
const DMX_BRIDGE_URL = process.env.DMX_BRIDGE_URL || "";
const DMX_BRIDGE_TOKEN = process.env.DMX_BRIDGE_TOKEN || "c8-7F29A4D6";
const REAL_DMX_ADDRESS = 94;
const REAL_DMX_PORT = 1;

const HEADSET_TIMEOUT_MS = 2200;
const PRESENCE_CHECK_MS = 100;

const rooms = new Map();

app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));

// function getDmxBridgeOrigins(req) {
//   const origins = [];

//   if (DMX_BRIDGE_URL) {
//     origins.push(DMX_BRIDGE_URL);
//   }

//   origins.push(`http://127.0.0.1:${DMX_BRIDGE_PORT}`);

//   const localAddress = req?.socket?.localAddress?.replace(/^::ffff:/, "");
//   if (localAddress && localAddress !== "127.0.0.1" && localAddress !== "::1") {
//     origins.push(`http://${localAddress}:${DMX_BRIDGE_PORT}`);
//   }

//   Object.values(os.networkInterfaces()).flat().forEach((entry) => {
//     if (entry && entry.family === "IPv4" && !entry.internal) {
//       origins.push(`http://${entry.address}:${DMX_BRIDGE_PORT}`);
//     }
//   });

//   return [...new Set(origins)];
// }

// function requestDmxOrigin(origin, pathname, { method = "GET", body } = {}) {
//   return new Promise((resolve, reject) => {
//     const url = new URL(pathname, origin);
//     url.searchParams.set("token", DMX_BRIDGE_TOKEN);
//     const payload = body === undefined ? "" : JSON.stringify(body);

//     const bridgeRequest = http.request(url, {
//       method,
//       headers: payload ? {
//         "Content-Type": "application/json",
//         "Content-Length": Buffer.byteLength(payload)
//       } : undefined,
//       timeout: 3500
//     }, (bridgeResponse) => {
//       let responseText = "";

//       bridgeResponse.setEncoding("utf8");
//       bridgeResponse.on("data", (chunk) => {
//         responseText += chunk;
//         if (responseText.length > 64 * 1024) {
//           bridgeRequest.destroy(new Error("DMX Bridge response is too large."));
//         }
//       });
//       bridgeResponse.on("end", () => {
//         let data = null;
//         try { data = JSON.parse(responseText); }
//         catch { data = { ok: false, error: responseText || "Invalid DMX Bridge response." }; }

//         if (bridgeResponse.statusCode < 200 || bridgeResponse.statusCode >= 300) {
//           const error = new Error(data.error || `DMX Bridge returned ${bridgeResponse.statusCode}.`);
//           error.statusCode = bridgeResponse.statusCode;
//           reject(error);
//           return;
//         }

//         resolve(data);
//       });
//     });

//     bridgeRequest.on("timeout", () => bridgeRequest.destroy(new Error("DMX Bridge timed out.")));
//     bridgeRequest.on("error", reject);
//     if (payload) bridgeRequest.write(payload);
//     bridgeRequest.end();
//   });
// }

// async function requestDmxBridge(req, pathname, options) {
//   let lastError = null;

//   for (const origin of getDmxBridgeOrigins(req)) {
//     try {
//       return await requestDmxOrigin(origin, pathname, options);
//     } catch (error) {
//       lastError = error;
//       if (error.statusCode) break;
//     }
//   }

//   throw lastError || new Error("DMX Bridge is unavailable.");
// }

// function sendDmxError(res, error) {
//   res.status(error.statusCode || 503).json({
//     ok: false,
//     error: error.message || "DMX Bridge is unavailable."
//   });
// }

// app.get("/api/real-dmx/status", async (req, res) => {
//   try {
//     const status = await requestDmxBridge(
//       req,
//       `/api/status?address=${REAL_DMX_ADDRESS}`
//     );

//     res.json({
//       ...status,
//       port: REAL_DMX_PORT,
//       address: REAL_DMX_ADDRESS
//     });
//   } catch (error) {
//     sendDmxError(res, error);
//   }
// });

// app.post("/api/real-dmx/level", async (req, res) => {
//   const level = Number(req.body?.level);
//   if (!Number.isFinite(level) || level < 0 || level > 100) {
//     res.status(400).json({ ok: false, error: "Level must be from 0 to 100." });
//     return;
//   }

//   try {
//     const result = await requestDmxBridge(req, "/api/level", {
//       method: "POST",
//       body: { address: REAL_DMX_ADDRESS, level }
//     });

//     res.json({
//       ...result,
//       port: REAL_DMX_PORT,
//       address: REAL_DMX_ADDRESS
//     });
//   } catch (error) {
//     sendDmxError(res, error);
//   }
// });

// app.post("/api/real-dmx/out", async (req, res) => {
//   try {
//     const result = await requestDmxBridge(req, "/api/out", {
//       method: "POST",
//       body: { address: REAL_DMX_ADDRESS }
//     });

//     res.json({
//       ...result,
//       port: REAL_DMX_PORT,
//       address: REAL_DMX_ADDRESS
//     });
//   } catch (error) {
//     sendDmxError(res, error);
//   }
// });

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    headsetTimeoutMs: HEADSET_TIMEOUT_MS,
    presenceCheckMs: PRESENCE_CHECK_MS,
    realDmx: {
      port: REAL_DMX_PORT,
      transport: "dmx-agent",
      addressRange: [1, 512]
    },
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
      dmxAgent: null,
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

function isDmxAgentOnline(room) {
  return isOpen(room.dmxAgent);
}

function broadcastDmxAgentStatus(room, connected = isDmxAgentOnline(room), extra = {}) {
  const payload = {
    type: "dmx-agent-status",
    connected,
    ...extra
  };

  room.controllers.forEach((controller) => sendJson(controller, payload));
}

function removeDmxAgent(room, ws) {
  if (room.dmxAgent !== ws) {
    return;
  }

  room.dmxAgent = null;
  broadcastDmxAgentStatus(room, false);
  console.log(`[${VERSION}] DMX agent offline`);
}

function isDmxMessage(parsed) {
  return parsed && (
    parsed.type === "dmx-output" ||
    parsed.type === "dmx-status-request" ||
    parsed.type === "dmx-range-status-request" ||
    parsed.type === "dmx-range-out" ||
    parsed.type === "dmx-blackout"
  );
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
  } else if (role === "dmx-agent") {
    if (isOpen(room.dmxAgent)) {
      closeQuietly(room.dmxAgent);
    }

    room.dmxAgent = ws;

    sendJson(ws, {
      type: "relay-ready",
      role: "dmx-agent",
      room: roomId,
      version: VERSION
    });

    broadcastDmxAgentStatus(room, true, { gadgetConnected: null });
    console.log(`[${VERSION}] DMX agent online`);
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

    sendJson(ws, {
      type: "dmx-agent-status",
      connected: isDmxAgentOnline(room),
      gadgetConnected: null
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

    if (ws.role === "dmx-agent") {
      if (parsed && parsed.type === "heartbeat") {
        return;
      }

      if (!parsed) {
        return;
      }

      if (parsed.type === "dmx-agent-status") {
        broadcastDmxAgentStatus(room, true, parsed);
        return;
      }

      if (parsed.type === "dmx-result" || parsed.type === "dmx-range-status") {
        room.controllers.forEach((controller) => sendJson(controller, parsed));
      }
      return;
    }

    if (ws.role === "controller") {
      if (isDmxMessage(parsed)) {
        if (isDmxAgentOnline(room)) {
          send(room.dmxAgent, message);
        } else {
          sendJson(ws, {
            type: "dmx-result",
            ok: false,
            requestId: parsed.requestId || null,
            error: "DMX control computer is not connected."
          });
          sendJson(ws, {
            type: "dmx-agent-status",
            connected: false
          });
        }
        return;
      }

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

    if (ws.role === "dmx-agent") {
      removeDmxAgent(room, ws);
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

    if (ws.role === "dmx-agent") {
      removeDmxAgent(room, ws);
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
