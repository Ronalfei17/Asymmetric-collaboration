export const CONTROL_CONFIG = {
    mode: 'websocket',
    relayUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
    role: 'controller',
    room: 'gp9'
};

export const VIDEO_CONFIG = {
    relayUrl: CONTROL_CONFIG.relayUrl,
    role: 'viewer',
    room: CONTROL_CONFIG.room
};