import { connectControlServer, closeControlServer, sendControlMessage } from './control-channel.js';
import { connectVideoRelay, closeVideoRelay, startVideoStream, stopVideoStream } from './video-stream.js';
import { setupLightingControl } from './lighting-control.js';
import { setupTeleportMap } from './teleport-map.js';
import { setupCueList } from './cue-list.js';
import { setupSidebar } from './sidebar.js';
import { setupStatus } from './status.js';
import { CONTROL_CONFIG } from './config.js';
import { setupFixtureLibrary } from './fixture-library.js';
import { setupMapSwitcher } from './map-switcher.js';
import { setupLightingMapOverlay } from './lighting-map-overlay.js';

console.log('[MAIN] loaded');

function createIcons() {
    if (window.lucide) {
        window.lucide.createIcons();
    } else {
        console.warn('[UI] lucide is not loaded yet');
    }
}

setupStatus();
setupSidebar();
setupLightingControl(sendControlMessage);
setupFixtureLibrary();
setupTeleportMap(sendControlMessage);
setupCueList(sendControlMessage);
setupMapSwitcher();
setupLightingControl(sendControlMessage);
setupMapSwitcher();
setupLightingMapOverlay();

connectControlServer();
connectVideoRelay();

document.getElementById('startVideoButton')?.addEventListener('click', startVideoStream);
document.getElementById('stopVideoButton')?.addEventListener('click', () => stopVideoStream(true));
document.getElementById('lightingMoreBtn')?.addEventListener('click', () => {
    document
        .querySelector('.nav-btn[data-target="page-light"]')
        ?.click();
});

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