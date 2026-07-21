import {
    LIGHTING_MAP_MARKERS,
} from './lighting-map-markers.js';

import {
    getFixtureById
} from './lighting-fixture.js';

import {
    getSelectedLightingFixture
} from './lighting-control.js';

let activeMapType = 'theatre';
let selectedLightId = null;

function getOverlay() {
    return document.getElementById('lightingMapOverlay');
}

function createMarkerElement(marker) {
    const button = document.createElement('button');

    button.type = 'button';
    button.dataset.markerId = marker.markerId;
    button.dataset.lightId = String(marker.lightId);
    button.title = marker.label;

    button.className = [
        'absolute',
        'pointer-events-auto',
        'transition-transform',
        'duration-150',
        'outline-none'
    ].join(' ');

    button.style.left = `${marker.x * 100}%`;
    button.style.top = `${marker.y * 100}%`;
    button.style.width = `${marker.width * 100}%`;
    button.style.height = `${marker.height * 100}%`;
    button.dataset.baseTransform = `translate(-50%, -50%) rotate(${marker.rotation}deg)`;
    button.style.transform = button.dataset.baseTransform;

    const icon = document.createElement('span');

    icon.className = [
        'block',
        'w-full',
        'h-full',
        'transition-all',
        'duration-150'
    ].join(' ');

    icon.style.webkitMaskImage = `url("${marker.asset}")`;
    icon.style.maskImage = `url("${marker.asset}")`;
    icon.style.webkitMaskRepeat = 'no-repeat';
    icon.style.maskRepeat = 'no-repeat';

    icon.style.webkitMaskSize = 'contain';
    icon.style.maskSize = 'contain';

    icon.style.webkitMaskPosition = 'center';
    icon.style.maskPosition = 'center';

    button.appendChild(icon);
    button.style.touchAction = 'none';

    let isPointerDownOnMarker = false;

    function stopMapInteraction(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    button.addEventListener('pointerdown', event => {
        isPointerDownOnMarker = true;
        stopMapInteraction(event);
    });

    button.addEventListener('pointerup', event => {
        stopMapInteraction(event);

        if (!isPointerDownOnMarker) return;

        isPointerDownOnMarker = false;

        selectMarker(marker.lightId, {
            source: 'lighting-map'
        });
    });

    button.addEventListener('pointercancel', event => {
        isPointerDownOnMarker = false;
        stopMapInteraction(event);
    });

    button.addEventListener('click', event => {
        stopMapInteraction(event);
    });

    return button;
}

function updateMarkerVisual(button) {
    const lightId = Number(button.dataset.lightId);
    const icon = button.firstElementChild;

    if(!icon) return;
    const isSelected = lightId === selectedLightId;

    if (isSelected) {
        icon.style.backgroundColor = '#3B82F6';
        icon.style.filter = 'drop-shadow(0 0 8px rgba(59,130,246,0.65))';

        button.style.zIndex = '30';
        button.style.transform = `${button.dataset.baseTransform} scale(1.08)`;
    } else {
        icon.style.backgroundColor ='#FFFFFF';
        icon.style.filter = 'none';

        button.style.zIndex = '10';
        button.style.transform = `${button.dataset.baseTransform} scale(1)`;
    }
}

function refreshMarkerVisuals() {
    const overlay = getOverlay();

    if (!overlay) return;

    const markerButtons = overlay.querySelectorAll('button[data-light-id]');

    markerButtons.forEach(button => {
        updateMarkerVisual(button);
    });
}

function updateSelectedInfoFromFixture(lightId) {
    const fixture = getFixtureById(lightId);

    if(!fixture) {
        console.warn('[LightingMapOverlay] Fixture not found:', lightId);
        return;
    }

    const selectedId = document.getElementById('selectedId');
    const selectedName = document.getElementById('selectedName');
    const selectedType = document.getElementById('selectedType');

    if (selectedId) {
        selectedId.textContent = fixture.displayId || `CH ${fixture.lightId}`;
    }
    if (selectedName) {
        selectedName.textContent = fixture.label || '--';
    }
    if (selectedType) {
        selectedType.textContent =
            fixture.fixtureTypeLabel || fixture.fixtureType || '--';
    }
}

function hasMarkerForLight(lightId) {
    return LIGHTING_MAP_MARKERS.some(marker =>
        Number(marker.lightId) === Number(lightId)
    );
}

function syncSelectedMarkerFromLightingControl() {
    const selectedFixture = getSelectedLightingFixture();

    if (!selectedFixture) {
        selectedLightId = null;
        refreshMarkerVisuals();
        return;
    }

    const lightId = Number(selectedFixture.lightId);

    selectedLightId = lightId;
    refreshMarkerVisuals();
    updateSelectedInfoFromFixture(selectedLightId);
}

function selectMarker(lightId, { source = 'lighting-map' } = {}) {
    selectedLightId = Number(lightId);
    refreshMarkerVisuals();
    updateSelectedInfoFromFixture(selectedLightId);

    window.dispatchEvent(new CustomEvent('lighting-fixture-selected', {
        detail: {
            lightId: selectedLightId,
            source
        }
    }));

    console.log('[LightingMapOverlay] Selected fixture:', selectedLightId);
}

function renderMarkers() {
    const overlay = getOverlay();
    overlay.innerHTML = '';

    LIGHTING_MAP_MARKERS.forEach(marker => {
        const markerElement = createMarkerElement(marker);
        overlay.appendChild(markerElement);
    });

    refreshMarkerVisuals();
}

function updateOverlayVisibility() {
    const overlay = getOverlay();

    if (!overlay) return;

    const shouldShow = activeMapType === 'lighting';

    overlay.classList.toggle('hidden', !shouldShow);
}

export function setupLightingMapOverlay() {
    renderMarkers();
    updateOverlayVisibility();

    window.addEventListener('map-type-changed', event => {
        activeMapType = event.detail?.mapType || 'theatre';
        updateOverlayVisibility();

        if (activeMapType === 'lighting') {
            syncSelectedMarkerFromLightingControl();
        }
    });

    window.addEventListener('lighting-fixture-selected', event => {
        const lightId = event.detail?.lightId;
        const source = event.detail?.source;

        if (lightId == null) return;
        if (source === 'lighting-map') return;

        selectedLightId = Number(lightId);
        refreshMarkerVisuals();

        if (activeMapType === 'lighting') {
            updateSelectedInfoFromFixture(selectedLightId);
        }
    });
}