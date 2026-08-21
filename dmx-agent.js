const http = require("http");
const WebSocket = require("ws");

const RELAY_URL = process.env.DMX_RELAY_URL || process.argv[2] || "ws://127.0.0.1:3000/ws";
const ROOM = process.env.DMX_ROOM || "gp9";
const AGENT_TOKEN = process.env.DMX_AGENT_TOKEN || "";
const BRIDGE_URL = process.env.DMX_BRIDGE_URL || "http://127.0.0.1:31808";
const BRIDGE_TOKEN = process.env.DMX_BRIDGE_TOKEN || "c8-7F29A4D6";
const DEFAULT_ADDRESS = 94;
const RECONNECT_MS = 1000;
const HEARTBEAT_MS = 1000;

let socket = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let lastAddress = DEFAULT_ADDRESS;
let commandQueue = Promise.resolve();

function clampInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function relayEndpoint() {
  const url = new URL(RELAY_URL);
  url.searchParams.set("role", "dmx-agent");
  url.searchParams.set("room", ROOM);
  if (AGENT_TOKEN) url.searchParams.set("token", AGENT_TOKEN);
  return url.toString();
}

function bridgeRequest(pathname, { method = "GET", body } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, BRIDGE_URL);
    url.searchParams.set("token", BRIDGE_TOKEN);
    const payload = body === undefined ? "" : JSON.stringify(body);
    const request = http.request(url, {
      method,
      headers: payload ? {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      } : undefined,
      timeout: 3500
    }, (response) => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { text += chunk; });
      response.on("end", () => {
        let data;
        try { data = JSON.parse(text); }
        catch { data = { ok: false, error: text || "Invalid DMX Bridge response." }; }

        if (response.statusCode < 200 || response.statusCode >= 300 || !data.ok) {
          reject(new Error(data.error || `DMX Bridge returned ${response.statusCode}.`));
          return;
        }
        resolve(data);
      });
    });

    request.on("timeout", () => request.destroy(new Error("DMX Bridge timed out.")));
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
}

function send(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

async function publishBridgeStatus(address = lastAddress) {
  try {
    const status = await bridgeRequest(`/api/status?address=${address}`);
    send({
      type: "dmx-agent-status",
      connected: true,
      gadgetConnected: Boolean(status.connected),
      serial: status.serial ?? null,
      port: status.port ?? 1,
      address,
      value: status.dmxValue ?? 0
    });
  } catch (error) {
    send({
      type: "dmx-agent-status",
      connected: true,
      gadgetConnected: false,
      error: error.message
    });
  }
}

async function handleRelayMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "relay-ready") {
    console.log(`[DMX Agent] connected to room ${ROOM}`);
    await publishBridgeStatus();
    return;
  }

  if (message.type === "dmx-status-request") {
    const address = clampInteger(message.payload?.address ?? lastAddress, 1, 512);
    if (address === null) return;
    lastAddress = address;
    await publishBridgeStatus(address);
    return;
  }

  if (message.type === "dmx-range-status-request") {
    let start = clampInteger(message.payload?.start, 1, 512);
    let end = clampInteger(message.payload?.end, 1, 512);
    if (start === null || end === null) return;
    if (start > end) [start, end] = [end, start];
    lastAddress = start;

    try {
      const result = await bridgeRequest(`/api/range?start=${start}&end=${end}`);
      send({
        type: "dmx-range-status",
        ok: true,
        gadgetConnected: true,
        serial: result.serial ?? null,
        port: result.port ?? 1,
        start,
        end,
        values: result.values || []
      });
    } catch (error) {
      send({
        type: "dmx-range-status",
        ok: false,
        gadgetConnected: false,
        start,
        end,
        error: error.message
      });
    }
    return;
  }

  if (message.type === "dmx-range-out") {
    let start = clampInteger(message.payload?.start, 1, 512);
    let end = clampInteger(message.payload?.end, 1, 512);
    if (start === null || end === null) return;
    if (start > end) [start, end] = [end, start];

    try {
      await bridgeRequest("/api/range-out", {
        method: "POST",
        body: { start, end }
      });
      send({ type: "dmx-result", operation: "range-out", ok: true, start, end });
    } catch (error) {
      send({ type: "dmx-result", operation: "range-out", ok: false, error: error.message });
    }
    return;
  }

  if (message.type === "dmx-blackout") {
    try {
      await bridgeRequest("/api/blackout", { method: "POST", body: {} });
      send({ type: "dmx-result", operation: "blackout", ok: true });
    } catch (error) {
      send({ type: "dmx-result", operation: "blackout", ok: false, error: error.message });
    }
    return;
  }

  if (message.type !== "dmx-output") return;

  const address = clampInteger(message.payload?.address, 1, 512);
  const value = clampInteger(message.payload?.value, 0, 255);
  const requestId = message.requestId || null;

  if (address === null || value === null) {
    send({
      type: "dmx-result",
      requestId,
      ok: false,
      error: "DMX address must be 1-512 and value must be 0-255."
    });
    return;
  }

  lastAddress = address;

  try {
    const result = await bridgeRequest("/api/value", {
      method: "POST",
      body: { address, value }
    });
    send({
      type: "dmx-result",
      requestId,
      ok: true,
      gadgetConnected: true,
      serial: result.serial ?? null,
      port: result.port ?? 1,
      address: result.address ?? address,
      value: result.dmxValue ?? value
    });
  } catch (error) {
    send({
      type: "dmx-result",
      requestId,
      ok: false,
      gadgetConnected: false,
      address,
      value,
      error: error.message
    });
  }
}

function scheduleReconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, RECONNECT_MS);
}

function connect() {
  clearTimeout(reconnectTimer);
  clearInterval(heartbeatTimer);
  console.log(`[DMX Agent] connecting to ${RELAY_URL} (room ${ROOM})`);
  socket = new WebSocket(relayEndpoint());

  socket.on("open", () => {
    heartbeatTimer = setInterval(() => send({ type: "heartbeat" }), HEARTBEAT_MS);
  });

  socket.on("message", (data) => {
    let message = null;
    try { message = JSON.parse(data.toString()); }
    catch {}
    commandQueue = commandQueue
      .then(() => handleRelayMessage(message))
      .catch((error) => {
        console.error(`[DMX Agent] message failed: ${error.message}`);
      });
  });

  socket.on("close", () => {
    clearInterval(heartbeatTimer);
    console.log("[DMX Agent] relay disconnected; retrying…");
    scheduleReconnect();
  });

  socket.on("error", (error) => {
    console.error(`[DMX Agent] relay error: ${error.message}`);
  });
}

process.on("SIGINT", () => {
  clearTimeout(reconnectTimer);
  clearInterval(heartbeatTimer);
  if (socket) socket.close();
  process.exit(0);
});

connect();
