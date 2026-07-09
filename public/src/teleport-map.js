export function setupTeleportMap(sendControlMessage) {
    const viewport = document.getElementById('mapViewport');
    const content = document.getElementById('mapContent');
    const image = document.getElementById('theatrePlanImage');
    const selectedMapPin = document.getElementById('selectedMapPin');
    const zoomIn = document.getElementById('mapZoomIn');
    const zoomOut = document.getElementById('mapZoomOut');
    const resetView = document.getElementById('mapResetView');

    if (!viewport || !content || !image) return;

    const view = {
        scale: 1,
        x: 0,
        y: 0,
        dragging: false,
        moved: false,
        lastX: 0,
        lastY: 0
    };

    const TELEPORT_REGIONS = [
    {
        id: 'USR',
        name: 'Upstage Right',
        type: 'Teleport Region',
        minX: 0.32,
        maxX: 0.53,
        minZ: 0.59,
        maxZ: 0.72,
        yaw: 0
    },
    {
        id: 'USL',
        name: 'Upstage Left',
        type: 'Teleport Region',
        minX: 0.53,
        maxX: 0.74,
        minZ: 0.59,
        maxZ: 0.72,
        yaw: 0
    },
    {
        id: 'DSR',
        name: 'Downstage Right',
        type: 'Teleport Region',
        minX: 0.36,
        maxX: 0.53,
        minZ: 0.47,
        maxZ: 0.59,
        yaw: 0
    },
    {
        id: 'DSL',
        name: 'Downstage Left',
        type: 'Teleport Region',
        minX: 0.53,
        maxX: 0.70,
        minZ: 0.47,
        maxZ: 0.59,
        yaw: 0
    },
    {
        id: 'AUD',
        name: 'Audience',
        type: 'Teleport Region',
        minX: 0.39,
        maxX: 0.62,
        minZ: 0.22,
        maxZ: 0.45,
        yaw: 0
    },
    {
        id: 'OP',
        name: 'Opposite Prompt',
        type: 'Teleport Region',
        minX: 0.18,
        maxX: 0.36,
        minZ: 0.42,
        maxZ: 0.54,
        yaw: 0
    },
    {
        id: 'PS',
        name: 'Prompt Side',
        type: 'Teleport Region',
        minX: 0.70,
        maxX: 0.82,
        minZ: 0.42,
        maxZ: 0.54,
        yaw: 0
    }
];

function getTeleportRegion(point) {
    return TELEPORT_REGIONS.find(region =>
        point.x >= region.minX &&
        point.x <= region.maxX &&
        point.z >= region.minZ &&
        point.z <= region.maxZ
    ) || {
        id: 'FREE',
        name: 'Free Position',
        type: 'Free Teleport',
        yaw: 0
    };
}

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function clamp01(value) {
        return clamp(value, 0, 1);
    }

    function renderMapTransform() {
        content.style.transform =
            `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`;
    }

    function zoomMap(delta) {
        view.scale = clamp(view.scale + delta, 0.6, 3);
        renderMapTransform();
    }

    function resetMapView() {
        view.scale = 1;
        view.x = 0;
        view.y = 0;
        renderMapTransform();
    }

    function getImagePercentFromPointer(event) {
        const rect = image.getBoundingClientRect();

        const pixelX = event.clientX - rect.left;
        const pixelY = event.clientY - rect.top;

        const pctX = clamp01(pixelX / rect.width);
        const pctY = clamp01(1 - pixelY / rect.height);

        return {
            x: pctX,
            y: 0,
            z: pctY,
            yaw: 0,
            imageLeft: pctX * 100,
            imageTop: (1 - pctY) * 100
        };
    }

    function updateSelectedInfo(point) {
        const region = getTeleportRegion(point);

        const selectedId = document.getElementById('selectedId');
        const selectedName = document.getElementById('selectedName');
        const selectedType = document.getElementById('selectedType');
        const selectedPosition = document.getElementById('selectedPosition');
        const selectedDirection = document.getElementById('selectedDirection');

        if (selectedId) selectedId.innerText = region.id;
        if (selectedName) selectedName.innerText = region.name;
        if (selectedType) selectedType.innerText = region.type;
        if (selectedPosition) {
            selectedPosition.innerText =
                `X: ${(point.x * 100).toFixed(1)}%   Z: ${(point.z * 100).toFixed(1)}%`;
        }
        if (selectedDirection) {
            selectedDirection.innerHTML = `${region.yaw || point.yaw}&deg;`;
        }

        point.regionId = region.id;
        point.regionName = region.name;
        point.regionType = region.type;
        point.yaw = region.yaw || point.yaw;
    }

    function teleportFromPointer(event) {
        const point = getImagePercentFromPointer(event);

        if (selectedMapPin) {
            selectedMapPin.classList.remove('hidden');
            selectedMapPin.style.left = `${point.imageLeft}%`;
            selectedMapPin.style.top = `${point.imageTop}%`;
        }

        updateSelectedInfo(point);

        sendControlMessage('teleport-origin', {
            x: point.x,
            y: point.y,
            z: point.z,
            yaw: point.yaw,
            regionId: point.regionId,
            regionName: point.regionName,
            regionType: point.regionType
        });
    }

    viewport.addEventListener('wheel', event => {
        event.preventDefault();
        zoomMap(event.deltaY < 0 ? 0.12 : -0.12);
    }, { passive: false });

    viewport.addEventListener('pointerdown', event => {
        view.dragging = true;
        view.moved = false;
        view.lastX = event.clientX;
        view.lastY = event.clientY;
        viewport.setPointerCapture(event.pointerId);
        viewport.classList.remove('cursor-grab');
        viewport.classList.add('cursor-grabbing');
    });

    viewport.addEventListener('pointermove', event => {
        if (!view.dragging) return;

        const dx = event.clientX - view.lastX;
        const dy = event.clientY - view.lastY;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            view.moved = true;
        }

        view.x += dx;
        view.y += dy;
        view.lastX = event.clientX;
        view.lastY = event.clientY;

        renderMapTransform();
    });

    viewport.addEventListener('pointerup', event => {
        if (!view.moved) {
            teleportFromPointer(event);
        }

        view.dragging = false;
        view.moved = false;
        viewport.classList.remove('cursor-grabbing');
        viewport.classList.add('cursor-grab');
    });

    if (zoomIn) {
        zoomIn.addEventListener('click', event => {
            event.stopPropagation();
            zoomMap(0.15);
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener('click', event => {
            event.stopPropagation();
            zoomMap(-0.15);
        });
    }

    if (resetView) {
        resetView.addEventListener('click', event => {
            event.stopPropagation();
            resetMapView();
        });
    }

    resetMapView();
}