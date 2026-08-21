import { CONTROL_CONFIG } from './config.js';
import { mockConnect } from './status.js';

let controlSocket = null;
let reconnectTimer = null;

const controlMessageListeners = new Set();
const controlOpenListeners = new Set();
const controlStateListeners = new Set();

function getControlWsUrl() {
    const params = new URLSearchParams({
        role: CONTROL_CONFIG.role,
        room: CONTROL_CONFIG.room
    });

    return `${CONTROL_CONFIG.relayUrl}?${params.toString()}`;
}

function publishControlState(connected) {
    controlStateListeners.forEach(listener => listener(connected));
}

export function subscribeControlMessages(listener) {
    controlMessageListeners.add(listener);

    return () => {
        controlMessageListeners.delete(listener);
    };
}

export function subscribeControlOpen(listener) {
    controlOpenListeners.add(listener);

    if (
        controlSocket &&
        controlSocket.readyState === WebSocket.OPEN
    ) {
        queueMicrotask(listener);
    }

    return () => {
        controlOpenListeners.delete(listener);
    };
}

export function subscribeControlState(listener) {
    controlStateListeners.add(listener);
    queueMicrotask(() => listener(Boolean(
        controlSocket && controlSocket.readyState === WebSocket.OPEN
    )));

    return () => {
        controlStateListeners.delete(listener);
    };
}

export function sendRawControlMessage(message) {
    console.log('[CONTROL RAW]', message);

    if (CONTROL_CONFIG.mode === 'mock') {
        return true;
    }

    const json = JSON.stringify(message);

    if (
        CONTROL_CONFIG.mode === 'websocket' &&
        controlSocket &&
        controlSocket.readyState === WebSocket.OPEN
    ) {
        controlSocket.send(json);
        return true;
    }

    if (
        CONTROL_CONFIG.mode === 'datachannel' &&
        window.controlDataChannel &&
        window.controlDataChannel.readyState === 'open'
    ) {
        window.controlDataChannel.send(json);
        return true;
    }

    return false;
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

    if (CONTROL_CONFIG.mode === 'mock') return true;

    if (
        CONTROL_CONFIG.mode === 'websocket' &&
        controlSocket &&
        controlSocket.readyState === WebSocket.OPEN
    ) {
        controlSocket.send(JSON.stringify(message));
        return true;
    }

    if (
        CONTROL_CONFIG.mode === 'datachannel' &&
        window.controlDataChannel &&
        window.controlDataChannel.readyState === 'open'
    ) {
        window.controlDataChannel.send(JSON.stringify(message));
        return true;
    }

    return false;
}

export function connectControlServer() {
    if (CONTROL_CONFIG.mode !== 'websocket') {
        mockConnect(true);
        publishControlState(true);
        return;
    }

    controlSocket = new WebSocket(getControlWsUrl());

    controlSocket.addEventListener('open', () => {
        clearTimeout(reconnectTimer);
        mockConnect(true);
        publishControlState(true);
        sendControlMessage('heartbeat');
        controlOpenListeners.forEach(listener => listener());
    });

    controlSocket.addEventListener('close', () => {
        mockConnect(false);
        publishControlState(false);
        reconnectTimer = setTimeout(connectControlServer, 1000);
    });

    controlSocket.addEventListener('error', () => {
        mockConnect(false);
        publishControlState(false);
    });

    controlSocket.addEventListener('message', event => {
        console.log('[CloudRelay]', event.data);

        let message = null;
        try {message = JSON.parse(event.data);}
        catch {}
        controlMessageListeners.forEach(
            listener => {listener(message ?? event.data);}
        );
    });
}

export function closeControlServer() {
    clearTimeout(reconnectTimer);

    if (controlSocket && controlSocket.readyState === WebSocket.OPEN) {
        controlSocket.close();
    }
}
