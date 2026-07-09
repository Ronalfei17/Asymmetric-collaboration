import { VIDEO_CONFIG } from './config.js';

let videoSocket = null;
let videoPeer = null;
let videoConnectionId = null;
let videoRemoteStream = null;
let videoStreamerOnline = false;
let videoHasTrack = false;
let videoPendingCandidates = [];

function getVideoWsUrl() {
    const params = new URLSearchParams({
        role: VIDEO_CONFIG.role,
        room: VIDEO_CONFIG.room
    });

    return `${VIDEO_CONFIG.relayUrl}?${params.toString()}`;
}

function setVideoStatus(text, connected = false) {
    const dot = document.getElementById('videoStatusDot');
    const label = document.getElementById('videoStatusText');

    if (dot) {
        dot.className = connected
            ? 'w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]'
            : 'w-2 h-2 rounded-full bg-gray-500';
    }

    if (label) {
        label.innerText = text;
        label.className = connected ? 'text-green-400' : 'text-gray-400';
    }
}

function sendVideoJson(payload) {
    if (!videoSocket || videoSocket.readyState !== WebSocket.OPEN) {
        return false;
    }

    videoSocket.send(JSON.stringify(payload));
    return true;
}

function sendVideoSignal(type, data = {}) {
    return sendVideoJson({
        from: videoConnectionId,
        type,
        data: {
            connectionId: videoConnectionId,
            ...data
        }
    });
}

export function connectVideoRelay() {
    if (videoSocket && videoSocket.readyState === WebSocket.OPEN) {
        return;
    }

    videoSocket = new WebSocket(getVideoWsUrl());
    setVideoStatus('Connecting video...', false);

    videoSocket.addEventListener('open', () => {
        setVideoStatus('Video relay connected', false);
    });

    videoSocket.addEventListener('message', async event => {
        let message;

        try {
            message = JSON.parse(event.data);
        } catch (error) {
            console.warn('[VIDEO] Invalid relay message:', event.data);
            return;
        }

        await handleVideoRelayMessage(message);
    });

    videoSocket.addEventListener('close', () => {
        setVideoStatus('Video offline', false);
    });

    videoSocket.addEventListener('error', () => {
        setVideoStatus('Video error', false);
    });
}

async function handleVideoRelayMessage(message) {
    if (message.type === 'stream-status') {
        videoStreamerOnline = Boolean(message.connected);
        setVideoStatus(
            videoStreamerOnline ? 'Streamer online' : 'Streamer offline',
            videoStreamerOnline
        );

        return;
    }

    if (message.type === 'answer') {
        const data = message.data || message;

        if (!videoPeer || !data.sdp) return;

        await videoPeer.setRemoteDescription({
            type: 'answer',
            sdp: data.sdp
        });

        await flushVideoCandidates();
        return;
    }

    if (message.type === 'offer') {
        const data = message.data || message;

        if (!data.sdp) return;

        videoConnectionId = message.from || data.connectionId || videoConnectionId;

        if (!videoPeer) {
            videoPeer = createVideoPeer();
        }

        await videoPeer.setRemoteDescription({
            type: 'offer',
            sdp: data.sdp
        });

        await flushVideoCandidates();

        const answer = await videoPeer.createAnswer();
        await videoPeer.setLocalDescription(answer);

        sendVideoSignal('answer', {
            type: 'answer',
            sdp: videoPeer.localDescription.sdp
        });

        return;
    }

    if (message.type === 'candidate') {
        const data = message.data || message;

        if (!videoPeer || !data.candidate) return;

        await addVideoCandidate(data);
        return;
    }

    if (message.type === 'disconnect') {
        stopVideoStream(false);
    }
}

function createVideoPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });

    const remoteVideo = document.getElementById('remoteVideo');
    const emptyState = document.getElementById('videoEmptyState');

    videoRemoteStream = new MediaStream();

    if (remoteVideo) {
        remoteVideo.srcObject = videoRemoteStream;
    }

    peer.addTransceiver('video', { direction: 'recvonly' });

    peer.ontrack = event => {
        const stream = event.streams && event.streams[0];

        if (remoteVideo) {
            remoteVideo.srcObject = stream || videoRemoteStream;
            remoteVideo.play().catch(() => {});
        }

        if (!stream && videoRemoteStream) {
            videoRemoteStream.addTrack(event.track);
        }

        if (emptyState) {
            emptyState.classList.add('hidden');
        }

        videoHasTrack = true;
        setVideoStatus('Video live', true);
    };

    peer.onicecandidate = event => {
        if (!event.candidate) return;

        sendVideoSignal('candidate', {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex
        });
    };

    peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
            setVideoStatus('Video live', true);
        }

        if (
            peer.connectionState === 'failed' ||
            peer.connectionState === 'closed' ||
            peer.connectionState === 'disconnected'
        ) {
            setVideoStatus('Video disconnected', false);
        }
    };

    return peer;
}

async function addVideoCandidate(data) {
    const candidate = {
        candidate: data.candidate,
        sdpMid: data.sdpMid,
        sdpMLineIndex: data.sdpMLineIndex
    };

    if (!videoPeer.remoteDescription) {
        videoPendingCandidates.push(candidate);
        return;
    }

    await videoPeer.addIceCandidate(candidate);
}

async function flushVideoCandidates() {
    const candidates = videoPendingCandidates;
    videoPendingCandidates = [];

    for (const candidate of candidates) {
        await videoPeer.addIceCandidate(candidate);
    }
}

export async function startVideoStream() {
    connectVideoRelay();

    if (!videoSocket || videoSocket.readyState !== WebSocket.OPEN) {
        setVideoStatus('Video relay not ready', false);
        return;
    }

    if (!videoStreamerOnline) {
        setVideoStatus('Streamer offline', false);
        return;
    }

    stopVideoStream(false);

    videoHasTrack = false;
    videoConnectionId = `viewer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    videoPeer = createVideoPeer();

    const offer = await videoPeer.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: false
    });

    await videoPeer.setLocalDescription(offer);

    sendVideoSignal('offer', {
        type: 'offer',
        sdp: videoPeer.localDescription.sdp
    });

    setVideoStatus('Requesting video...', false);
}

export function stopVideoStream(notifyQuest = true) {
    const remoteVideo = document.getElementById('remoteVideo');
    const emptyState = document.getElementById('videoEmptyState');

    if (notifyQuest && videoConnectionId) {
        sendVideoJson({
            type: 'disconnect',
            connectionId: videoConnectionId
        });
    }

    if (videoPeer) {
        videoPeer.getSenders().forEach(sender => {
            if (sender.track) sender.track.stop();
        });

        videoPeer.getReceivers().forEach(receiver => {
            if (receiver.track) receiver.track.stop();
        });

        videoPeer.close();
    }

    videoPeer = null;
    videoConnectionId = null;
    videoRemoteStream = null;
    videoHasTrack = false;
    videoPendingCandidates = [];

    if (remoteVideo) {
        remoteVideo.pause();
        remoteVideo.srcObject = null;
    }

    if (emptyState) {
        emptyState.classList.remove('hidden');
    }

    setVideoStatus('Video stopped', false);
}

export function closeVideoRelay() {
    stopVideoStream(true);

    if (videoSocket && videoSocket.readyState === WebSocket.OPEN) {
        videoSocket.close();
    }

    videoSocket = null;
}