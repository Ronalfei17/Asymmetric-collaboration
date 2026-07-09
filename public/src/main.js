import { connectControlServer, closeControlServer, sendControlMessage } from './control-channel.js';
import { connectVideoRelay, closeVideoRelay, startVideoStream, stopVideoStream } from './video-stream.js';
import { setupLightingControl } from './lighting-control.js';
import { setupTeleportMap } from './teleport-map.js';
import { setupCueList } from './cue-list.js';
import { setupSidebar } from './sidebar.js';
import { setupStatus } from './status.js';
import { CONTROL_CONFIG } from './config.js';

console.log('[MAIN] loaded');

function createIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        console.warn('[UI] lucide is not loaded yet');
    }
}

createIcons();

setupStatus();
setupSidebar();
setupLightingControl(sendControlMessage);
setupTeleportMap(sendControlMessage);
setupCueList(sendControlMessage);

connectControlServer();
connectVideoRelay();

document.getElementById('startVideoButton')?.addEventListener('click', startVideoStream);
document.getElementById('stopVideoButton')?.addEventListener('click', () => stopVideoStream(true));

setInterval(() => {
    if (CONTROL_CONFIG.mode !== 'mock') {
        sendControlMessage('heartbeat');
    }
}, 1000);

window.addEventListener('beforeunload', () => {
    closeVideoRelay();
    closeControlServer();
});

createIcons();

console.log('[MAIN] initialized');