import { CONTROL_CONFIG } from './config.js';
import { mockConnect } from './status.js';

let controlSocket = null;
let reconnectTimer = null;

function getControlWsUrl() {
    const params = new URLSearchParams({
        role: CONTROL_CONFIG.role,
        room: CONTROL_CONFIG.room
    });

    return `${CONTROL_CONFIG.relayUrl}?${params.toString()}`;
}

export function sendControlMessage(type, payload = {}) {
    const message = {
        type,
        payload,
        source: CONTROL_CONFIG.role,
        room: CONTROL_CONFIG.room,
        timestamp: Date.now()
    };

    console.log('[CONTROL]', message);

    if (CONTROL_CONFIG.mode === 'mock') return;

    if (
        CONTROL_CONFIG.mode === 'websocket' &&
        controlSocket &&
        controlSocket.readyState === WebSocket.OPEN
    ) {
        controlSocket.send(JSON.stringify(message));
    }

    if (
        CONTROL_CONFIG.mode === 'datachannel' &&
        window.controlDataChannel &&
        window.controlDataChannel.readyState === 'open'
    ) {
        window.controlDataChannel.send(JSON.stringify(message));
    }
}

export function connectControlServer() {
    if (CONTROL_CONFIG.mode !== 'websocket') {
        mockConnect(true);
        return;
    }

    controlSocket = new WebSocket(getControlWsUrl());

    controlSocket.addEventListener('open', () => {
        clearTimeout(reconnectTimer);
        mockConnect(true);
        sendControlMessage('heartbeat');
    });

    controlSocket.addEventListener('close', () => {
        mockConnect(false);
        reconnectTimer = setTimeout(connectControlServer, 1000);
    });

    controlSocket.addEventListener('error', () => {
        mockConnect(false);
    });

    controlSocket.addEventListener('message', event => {
        console.log('[CloudRelay]', event.data);
    });
}

export function closeControlServer() {
    clearTimeout(reconnectTimer);

    if (controlSocket && controlSocket.readyState === WebSocket.OPEN) {
        controlSocket.close();
    }
}