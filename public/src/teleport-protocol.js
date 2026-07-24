export const TELEPORT_MESSAGE_TYPES = Object.freeze({
    REQUEST: 'teleport.request',
    REQUEST_RECEIVED: 'teleport.request.received',
    RESPONSE: 'teleport.response',
    COMPLETED: 'teleport.completed',
    FAILED: 'teleport.failed',
    STATE_REQUEST: 'teleport.state.request',
    STATE: 'teleport.state',
    VR_POSE: 'vr.pose'
});

export function createTeleportRequest(targetPointId) {
    if (!targetPointId) {
        throw new Error('targetPointId is required.');
    }

    return {
        type: TELEPORT_MESSAGE_TYPES.REQUEST,
        protocolVersion: '1.0',
        sender: 'theatre-map',
        target: 'quest',
        requestId: `tp_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        targetPointId,
        timestamp: Date.now()
    };
}

export function createTeleportStateRequest() {
    return {
        type: TELEPORT_MESSAGE_TYPES.STATE_REQUEST,
        protocolVersion: '1.0',
        sender: 'theatre-map',
        target: 'quest',
        timestamp: Date.now()
    };
}

export function parseControlMessage(rawMessage) {
    if (!rawMessage) return null;

    if (typeof rawMessage === 'object') {
        return rawMessage;
    }

    try {
        return JSON.parse(rawMessage);
    } catch (error) {
        console.warn(
            '[TeleportProtocol] Invalid JSON:',
            rawMessage,
            error
        );

        return null;
    }
}

export function isTeleportOrPoseMessage(message) {
    if (!message?.type) return false;

    return Object.values(TELEPORT_MESSAGE_TYPES)
        .includes(message.type);
}
