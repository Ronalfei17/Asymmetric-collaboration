import {
    TELEPORT_MESSAGE_TYPES,
    createTeleportRequest,
    createTeleportStateRequest,
    isTeleportOrPoseMessage,
    parseControlMessage
} from './teleport-protocol.js';

const TELEPORT_POINTS = Object.freeze([
    {
        pointId: 'TP_AUDITORIUM_CENTRE',
        shortLabel: 'AUD Centre',
        name: 'Auditorium Centre',
        type: 'Fixed Teleport Point',
        position: {
            x: -1.346,
            y: 2.0,
            z: 10.23
        },
        mapPosition: {
            left: 52.57,
            top: 58.10
        }
    },
    {
        pointId: 'TP_AUDITORIUM_FRONT',
        shortLabel: 'AUD Front',
        name: 'Auditorium Front',
        type: 'Fixed Teleport Point',
        position: {
            x: -1.346,
            y: 1.676,
            z: 8.465
        },
        mapPosition: {
            left: 52.76,
            top: 53.03
        }
    },
    {
        pointId: 'TP_AUDITORIUM_REAR',
        shortLabel: 'AUD Rear',
        name: 'Auditorium Rear',
        type: 'Fixed Teleport Point',
        position: {
            x: -1.346,
            y: 2.86,
            z: 12.997
        },
        mapPosition: {
            left: 51.15,
            top: 67.11
        }
    },
    {
        pointId: 'TP_STAGE_CENTRE',
        shortLabel: 'Stage',
        name: 'Stage Centre',
        type: 'Fixed Teleport Point',
        position: {
            x: 0.0,
            y: 0.44,
            z: 0.0
        },
        mapPosition: {
            left: 53.27,
            top: 42.87
        }
    },
    {
    pointId: 'TP_AUDITORIUM_RIGHT',
    shortLabel: 'AUD Right',
    name: 'Auditorium Right',
    type: 'Fixed Teleport Point',

    position: {
        x: -2.72,
        y: 2,
        z: 10.23
    },
    mapPosition: {
        left: 58.1,
        top: 58.1
    }
},
{
    pointId: 'TP_AUDITORIUM_LEFT',
    shortLabel: 'AUD Left',
    name: 'Auditorium Left',
    type: 'Fixed Teleport Point',

    position: {
        x: 0.27,
        y: 2,
        z: 10.23
    },
        mapPosition: {
        left: 46.3,
        top: 57.9
    }
}
]);

const MAP_CALIBRATION_POINT_IDS = Object.freeze([
    'TP_STAGE_CENTRE',
    'TP_AUDITORIUM_FRONT',
    'TP_AUDITORIUM_REAR',
    'TP_AUDITORIUM_LEFT',
    'TP_AUDITORIUM_RIGHT'
]);

const MAP_CALIBRATION_REFERENCES =
    Object.freeze(
        MAP_CALIBRATION_POINT_IDS.map(
            pointId => {
                const point =
                    TELEPORT_POINTS.find(
                        item =>
                            item.pointId === pointId
                    );

                if (
                    !point ||
                    !point.mapPosition
                ) {
                    throw new Error(
                        `Missing calibration data: ${pointId}`
                    );
                }

                return Object.freeze({
                    label: point.name,

                    world: Object.freeze({
                        x: point.position.x,
                        z: point.position.z
                    }),

                    map: Object.freeze({
                        left:
                            point.mapPosition.left,

                        top:
                            point.mapPosition.top
                    })
                });
            }
        )
    );

const VIEW_RANGE_METRES = 3.0;
const FOV_ARC_SEGMENTS = 24;


const DEFAULT_VIEW_BY_MAP_TYPE = Object.freeze({
    theatre: {
        scale: 1,
        x: 0,
        y: 0
    },

    lighting: {
        scale: 1.35,
        x: -80,
        y: 140
    }
});

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function solve3x3(matrix, values) {
    const [
        [a, b, c],
        [d, e, f],
        [g, h, i]
    ] = matrix;

    const determinant =
        a * (e * i - f * h) -
        b * (d * i - f * g) +
        c * (d * h - e * g);

    if (Math.abs(determinant) < 1e-8) {
        throw new Error(
            'Map calibration points are collinear or invalid.'
        );
    }

    const determinantX =
        values[0] * (e * i - f * h) -
        b * (values[1] * i - f * values[2]) +
        c * (values[1] * h - e * values[2]);

    const determinantY =
        a * (values[1] * i - f * values[2]) -
        values[0] * (d * i - f * g) +
        c * (d * values[2] - values[1] * g);

    const determinantZ =
        a * (e * values[2] - values[1] * h) -
        b * (d * values[2] - values[1] * g) +
        values[0] * (d * h - e * g);

    return [
        determinantX / determinant,
        determinantY / determinant,
        determinantZ / determinant
    ];
}

function fitAffineCoefficients(
    references,
    mapProperty
) {
    const normalMatrix = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];

    const normalValues = [0, 0, 0];

    references.forEach(reference => {
        const row = [
            Number(reference.world.x),
            Number(reference.world.z),
            1
        ];

        const targetValue =
            Number(reference.map[mapProperty]);

        for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
            normalValues[rowIndex] +=
                row[rowIndex] * targetValue;

            for (
                let columnIndex = 0;
                columnIndex < 3;
                columnIndex++
            ) {
                normalMatrix[rowIndex][columnIndex] +=
                    row[rowIndex] *
                    row[columnIndex];
            }
        }
    });

    return solve3x3(
        normalMatrix,
        normalValues
    );
}

function createWorldToMapTransform(references) {
    if (!Array.isArray(references) || references.length < 3) {
        throw new Error(
            'At least three map calibration references are required.'
        );
    }

    const leftCoefficients = fitAffineCoefficients(references, 'left');
    const topCoefficients = fitAffineCoefficients(references, 'top');

    return function worldToMap(
        worldX,
        worldZ
    ) {
        const x = Number(worldX);
        const z = Number(worldZ);
        return {
            left:
                leftCoefficients[0] * x +
                leftCoefficients[1] * z +
                leftCoefficients[2],

            top:
                topCoefficients[0] * x +
                topCoefficients[1] * z +
                topCoefficients[2]
        };
    };
}

function getPointById(pointId) {
    return TELEPORT_POINTS.find(
        point => point.pointId === pointId
    ) || null;
}

function normalizeYaw(yaw) {
    const value = Number(yaw);

    if (!Number.isFinite(value)) {
        return null;
    }

    return ((value % 360) + 360) % 360;
}

function pointFromYaw(
    x,
    z,
    yawDegrees,
    distance
) {
    const radians =
        yawDegrees * Math.PI / 180;

    return {
        x: x + Math.sin(radians) * distance,
        z: z + Math.cos(radians) * distance
    };
}

function formatWorldPosition(position) {
    if (!position) return '--';

    return (
        `X: ${Number(position.x).toFixed(2)}  ` +
        `Y: ${Number(position.y).toFixed(2)}  ` +
        `Z: ${Number(position.z).toFixed(2)}`
    );
}

export function setupTeleportMap({
    sendRawControlMessage,
    subscribeControlMessages,
    subscribeControlOpen
} = {}) {
    const viewport =
        document.getElementById('mapViewport');

    const content =
        document.getElementById('mapContent');

    const image =
        document.getElementById('theatrePlanImage');

    const pointsOverlay =
        document.getElementById('teleportPointsOverlay');

    const vrViewOverlay =
        document.getElementById('vrViewOverlay');

    const vrFovPolygon =
        document.getElementById('vrFovPolygon');

    const vrHeadingLine =
        document.getElementById('vrHeadingLine');

    const vrUserDot =
        document.getElementById('vrUserDot');

    const zoomIn =
        document.getElementById('mapZoomIn');

    const zoomOut =
        document.getElementById('mapZoomOut');

    const resetView =
        document.getElementById('mapResetView');

    const selectedName =
        document.getElementById('selectedName');

    const selectedType =
        document.getElementById('selectedType');

    const selectedPosition =
        document.getElementById('selectedPosition');

    const selectedDirection =
        document.getElementById('selectedDirection');

    const selectedTeleportStatus =
        document.getElementById(
            'selectedTeleportStatus'
        );

    const requestButton =
        document.getElementById(
            'requestTeleportButton'
        );

    const modal =
        document.getElementById(
            'teleportRequestModal'
        );

    const modalMessage =
        document.getElementById(
            'teleportRequestMessage'
        );

    const cancelModalButton =
        document.getElementById(
            'cancelTeleportRequest'
        );

    const confirmModalButton =
        document.getElementById(
            'confirmTeleportRequest'
        );

    if (
        !viewport ||
        !content ||
        !image ||
        !pointsOverlay ||
        !vrViewOverlay
    ) {
        console.warn(
            '[TeleportMap] Required DOM elements are missing.'
        );

        return null;
    }

    if (typeof sendRawControlMessage !== 'function') {
        console.warn(
            '[TeleportMap] sendRawControlMessage is not configured.'
        );
    }

    const worldToMap =
        createWorldToMapTransform(
            MAP_CALIBRATION_REFERENCES
        );

    const state = {
        currentPointId: null,
        selectedPointId: null,
        pendingPointId: null,
        pendingRequestId: null,
        status: 'idle',
        statusMessage: 'No teleport point selected',
        vrPose: null
    };

    const view = {
        scale: 1,
        x: 0,
        y: 0,
        dragging: false,
        moved: false,
        lastX: 0,
        lastY: 0
    };

    const cleanupCallbacks = [];

    function getActiveMapType() {
        return (
            image.dataset.activeMapType ||
            'theatre'
        );
    }

    function isLightingMapMode() {
        return getActiveMapType() === 'lighting';
    }

    function renderMapTransform() {
        content.style.transform =
            `translate(` +
            `calc(-50% + ${view.x}px), ` +
            `calc(-50% + ${view.y}px)` +
            `) scale(${view.scale})`;
    }

    function zoomMap(delta) {
        view.scale = clamp(
            view.scale + delta,
            0.6,
            3
        );

        renderMapTransform();
    }

    function resetMapView(
        mapType = getActiveMapType()
    ) {
        const defaultView =
            DEFAULT_VIEW_BY_MAP_TYPE[mapType] ||
            DEFAULT_VIEW_BY_MAP_TYPE.theatre;

        view.scale = defaultView.scale;
        view.x = defaultView.x;
        view.y = defaultView.y;

        renderMapTransform();
    }

    function updateOverlayVisibility() {
        const hidden = isLightingMapMode();

        pointsOverlay.classList.toggle(
            'teleport-overlay-hidden',
            hidden
        );

        vrViewOverlay.classList.toggle(
            'teleport-overlay-hidden',
            hidden
        );

        if (hidden) {
            closeRequestModal();
        }
    }

    function clearSelectedInfo() {
        if (selectedName) {
            selectedName.textContent =
                'No teleport point selected';
        }

        if (selectedType) {
            selectedType.textContent = '--';
        }

        if (selectedPosition) {
            selectedPosition.textContent = '--';
        }

        updateDirectionText();
        updateStatusText();
        updateRequestButton();
    }

    function updateDirectionText() {
        if (!selectedDirection) return;

        const yaw =
            normalizeYaw(state.vrPose?.yaw);

        selectedDirection.textContent =
            yaw === null
                ? '--'
                : `${yaw.toFixed(1)}°`;
    }

    function updateStatusText() {
        if (!selectedTeleportStatus) return;

        selectedTeleportStatus.textContent =
            state.statusMessage || '--';
    }

    function updateSelectedInfo() {
        const point =
            getPointById(state.selectedPointId);

        if (!point) {
            clearSelectedInfo();
            return;
        }

        if (selectedName) {
            selectedName.textContent = point.name;
        }

        if (selectedType) {
            selectedType.textContent = point.type;
        }

        if (selectedPosition) {
            selectedPosition.textContent =
                formatWorldPosition(point.position);
        }

        updateDirectionText();
        updateStatusText();
        updateRequestButton();
    }

    function updateRequestButton() {
        if (!requestButton) return;

        const selectedPoint =
            getPointById(state.selectedPointId);

        const isBusy =
            Boolean(state.pendingRequestId);

        const alreadyCurrent =
            Boolean(selectedPoint) &&
            state.currentPointId ===
                selectedPoint.pointId;

        requestButton.disabled =
            !selectedPoint ||
            isBusy ||
            alreadyCurrent ||
            isLightingMapMode();

        if (!selectedPoint) {
            requestButton.textContent =
                'Select a Teleport Point';
            return;
        }

        if (isBusy) {
            requestButton.textContent =
                'Request Pending';
            return;
        }

        if (alreadyCurrent) {
            requestButton.textContent =
                'Current Position';
            return;
        }

        requestButton.textContent =
            'Request Teleport';
    }

    function createMarker(point) {
        const mapPosition = point.mapPosition || worldToMap(
            point.position.x,
            point.position.z
        );

        const button =
            document.createElement('button');

        button.type = 'button';
        button.className =
            'teleport-point-marker';

        button.dataset.pointId =
            point.pointId;

        button.dataset.shortLabel =
            point.shortLabel;
        
        button.style.left =
            `${mapPosition.left}%`;

        button.style.top =
            `${mapPosition.top}%`;

        button.setAttribute(
            'aria-label',
            `Select ${point.name}`
        );

        button.addEventListener('pointerdown', event => {
            event.stopPropagation();
        });

        button.addEventListener('click', event => {
            event.stopPropagation();

            if (isLightingMapMode()) {
                return;
            }

            selectPoint(point.pointId);
        });

        return button;
    }

    function renderTeleportPoints() {
        pointsOverlay.replaceChildren();

        TELEPORT_POINTS.forEach(point => {
            pointsOverlay.appendChild(
                createMarker(point)
            );
        });

        updateMarkerStates();
    }

    function updateMarkerStates() {
        pointsOverlay
            .querySelectorAll(
                '.teleport-point-marker'
            )
            .forEach(marker => {
                const pointId =
                    marker.dataset.pointId;

                marker.classList.toggle(
                    'is-selected',
                    state.selectedPointId === pointId
                );

                marker.classList.toggle(
                    'is-current',
                    state.currentPointId === pointId
                );

                marker.classList.toggle(
                    'is-pending',
                    state.pendingPointId === pointId
                );

                marker.disabled =
                    Boolean(state.pendingRequestId) &&
                    state.pendingPointId !== pointId;
            });
    }

    function selectPoint(pointId) {
        const point = getPointById(pointId);

        if (!point) return;

        state.selectedPointId = pointId;

        if (!state.pendingRequestId) {
            state.status = 'selected';

            state.statusMessage =
                state.currentPointId === pointId
                    ? 'Current Quest position'
                    : 'Ready to request teleport';
        }

        updateMarkerStates();
        updateSelectedInfo();
    }

    function openRequestModal() {
        const point =
            getPointById(state.selectedPointId);

        if (
            !point ||
            state.pendingRequestId ||
            state.currentPointId === point.pointId ||
            isLightingMapMode()
        ) {
            return;
        }

        if (modalMessage) {
            modalMessage.textContent =
                `Send a teleport request to ` +
                `${point.name}?`;
        }

        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function closeRequestModal() {
        if (!modal) return;

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function sendSelectedTeleportRequest() {
        const point =
            getPointById(state.selectedPointId);

        if (
            !point ||
            state.pendingRequestId ||
            typeof sendRawControlMessage !== 'function'
        ) {
            closeRequestModal();
            return;
        }

        const message =
            createTeleportRequest(point.pointId);

        const sent =
            sendRawControlMessage(message);

        if (!sent) {
            state.status = 'failed';
            state.statusMessage =
                'Control WebSocket is not connected';

            closeRequestModal();
            updateSelectedInfo();
            return;
        }

        state.pendingPointId =
            point.pointId;

        state.pendingRequestId =
            message.requestId;

        state.status =
            'request-sent';

        state.statusMessage =
            'Request sent. Waiting for Quest…';

        closeRequestModal();
        updateMarkerStates();
        updateSelectedInfo();
    }

    function requestCurrentState() {
        if (
            typeof sendRawControlMessage !== 'function'
        ) {
            return false;
        }

        return sendRawControlMessage(
            createTeleportStateRequest()
        );
    }

    function renderVrPose() {
        const pose = state.vrPose;

        if (!pose) {
            vrViewOverlay.classList.add('hidden');
            updateDirectionText();
            return;
        }

        const yaw =
            normalizeYaw(pose.yaw);

        const horizontalFov =
            Number(pose.horizontalFov);
        
        const currentPointId =
            state.currentPointId ||
            pose.currentPointId;

        const currentPoint =
            getPointById(currentPointId);

        if (!currentPoint) {
            vrViewOverlay.classList.add('hidden');
            updateDirectionText();
            return;
        }

        const originX = Number(currentPoint.position.x);
        const originZ = Number(currentPoint.position.z);

        if (
            yaw === null ||
            !Number.isFinite(horizontalFov)
        ) {
            vrViewOverlay.classList.add('hidden');
            updateDirectionText();
            return;
        }

        const rawCentre = worldToMap(
            originX,
            originZ
        );

        const centre =
            currentPoint.mapPosition ||
            rawCentre;
        
        const mapOffset = {
            left:
                centre.left -
                rawCentre.left,

            top:
                centre.top -
                rawCentre.top
        };

        function applyCurrentPointOffset(
            mapPoint
        ) {
            return {
                left:
                    mapPoint.left +
                    mapOffset.left,

                top:
                    mapPoint.top +
                    mapOffset.top
            };
        }

        const safeHorizontalFov =
            clamp(
                horizontalFov,
                10,
                160
            );

        const arcPoints = [];

        for (
            let index = 0;
            index <= FOV_ARC_SEGMENTS;
            index++
        ) {
            const ratio =
                index / FOV_ARC_SEGMENTS;

            const sampleYaw =
                yaw -
                safeHorizontalFov / 2 +
                safeHorizontalFov * ratio;

            const sampleWorld =
                pointFromYaw(
                    originX,
                    originZ,
                    sampleYaw,
                    VIEW_RANGE_METRES
                );

            const sampleMap =
                applyCurrentPointOffset(
                    worldToMap(
                        sampleWorld.x,
                        sampleWorld.z
                    )
                );

            arcPoints.push(
                `${sampleMap.left},${sampleMap.top}`
            );
        }

        const headingWorld =
            pointFromYaw(
                originX,
                originZ,
                yaw,
                VIEW_RANGE_METRES * 0.72
            );

        const heading =
            applyCurrentPointOffset(
                worldToMap(
                    headingWorld.x,
                    headingWorld.z
                )
            );

        vrFovPolygon?.setAttribute(
            'points',
            [
                `${centre.left},${centre.top}`,
                ...arcPoints,
                `${centre.left},${centre.top}`
            ].join(' ')
        );

        vrHeadingLine?.setAttribute(
            'x1',
            centre.left
        );

        vrHeadingLine?.setAttribute(
            'y1',
            centre.top
        );

        vrHeadingLine?.setAttribute(
            'x2',
            heading.left
        );

        vrHeadingLine?.setAttribute(
            'y2',
            heading.top
        );

        vrUserDot?.setAttribute(
            'cx',
            centre.left
        );

        vrUserDot?.setAttribute(
            'cy',
            centre.top
        );

        vrViewOverlay.classList.remove('hidden');
        updateDirectionText();
    }

    function clearPendingState() {
        state.pendingPointId = null;
        state.pendingRequestId = null;
    }

    function handleTeleportState(message) {
        state.currentPointId =
            message.currentTeleportPointId || message.currentPointId || null;

        state.pendingPointId =
            message.pendingTargetPointId || null;

        state.status =
            message.state || 'idle';

        state.statusMessage =
            state.pendingPointId
                ? 'Quest is processing a teleport request'
                : 'Quest state synchronized';

        updateMarkerStates();
        updateSelectedInfo();
        renderVrPose();
    }

    function handleRequestReceived(message) {
        if (
            state.pendingRequestId &&
            message.requestId !== state.pendingRequestId
        ) {
            return;
        }

        state.status =
            'waiting-for-quest';

        state.statusMessage =
            'Waiting for Quest user confirmation';

        updateMarkerStates();
        updateSelectedInfo();
    }

    function handleTeleportResponse(message) {
        if (
            state.pendingRequestId &&
            message.requestId !== state.pendingRequestId
        ) {
            return;
        }

        if (message.accepted) {
            state.status = 'teleporting';
            state.statusMessage =
                'Quest accepted. Teleporting…';
        } else {
            state.status = 'declined';
            state.statusMessage =
                message.reason === 'confirmation_timeout'
                    ? 'Quest confirmation timed out'
                    : 'Quest user declined the request';

            clearPendingState();
        }

        updateMarkerStates();
        updateSelectedInfo();
    }

    function handleTeleportCompleted(message) {
        state.currentPointId =
            message.targetPointId || null;

        state.selectedPointId =
            message.targetPointId || null;

        clearPendingState();

        state.status = 'completed';
        state.statusMessage =
            'Teleport completed';

        renderVrPose();
        updateMarkerStates();
        updateSelectedInfo();
    }

    function handleTeleportFailed(message) {
        clearPendingState();

        state.status = 'failed';
        state.statusMessage =
            message.reason
                ? `Teleport failed: ${message.reason}`
                : 'Teleport failed';

        updateMarkerStates();
        updateSelectedInfo();
    }

    function handleVrPose(message) {
        state.vrPose = {
            currentPointId:
                message.currentPointId || null,

            x: Number(message.x),
            y: Number(message.y),
            z: Number(message.z),
            yaw: Number(message.yaw),

            horizontalFov:
                Number(message.horizontalFov),

            timestamp:
                Number(message.timestamp)
        };

        if (!state.currentPointId && message.currentPointId) {
            state.currentPointId =
                message.currentPointId;
        }

        renderVrPose();
        updateMarkerStates();
        updateSelectedInfo();
    }

    function handleControlMessage(
        rawMessage
    ) {
        const message =
            parseControlMessage(rawMessage);

        if (
            !message ||
            !isTeleportOrPoseMessage(message)
        ) {
            return;
        }

        switch (message.type) {
            case TELEPORT_MESSAGE_TYPES.STATE:
                handleTeleportState(message);
                break;

            case TELEPORT_MESSAGE_TYPES.REQUEST_RECEIVED:
                handleRequestReceived(message);
                break;

            case TELEPORT_MESSAGE_TYPES.RESPONSE:
                handleTeleportResponse(message);
                break;

            case TELEPORT_MESSAGE_TYPES.COMPLETED:
                handleTeleportCompleted(message);
                break;

            case TELEPORT_MESSAGE_TYPES.FAILED:
                handleTeleportFailed(message);
                break;

            case TELEPORT_MESSAGE_TYPES.VR_POSE:
                handleVrPose(message);
                break;
        }
    }

    function getMapPercentFromPointer(event) {
        const rect =
            image.getBoundingClientRect();

        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {
            return null;
        }

        return {
            left:
                clamp(
                    (event.clientX - rect.left) /
                    rect.width,
                    0,
                    1
                ) * 100,

            top:
                clamp(
                    (event.clientY - rect.top) /
                    rect.height,
                    0,
                    1
                ) * 100
        };
    }

    function logCalibrationPoint(event) {
        const point =
            getMapPercentFromPointer(event);

        if (!point) return;

        console.log(
            '[TeleportMap Calibration]',
            {
                left:
                    Number(point.left.toFixed(3)),

                top:
                    Number(point.top.toFixed(3))
            }
        );
    }

    viewport.addEventListener(
        'wheel',
        event => {
            event.preventDefault();

            zoomMap(
                event.deltaY < 0
                    ? 0.12
                    : -0.12
            );
        },
        { passive: false }
    );

    viewport.addEventListener(
        'pointerdown',
        event => {
            if (
                event.target.closest(
                    '.teleport-point-marker'
                )
            ) {
                return;
            }

            view.dragging = true;
            view.moved = false;
            view.lastX = event.clientX;
            view.lastY = event.clientY;

            viewport.setPointerCapture(
                event.pointerId
            );

            viewport.classList.remove(
                'cursor-grab'
            );

            viewport.classList.add(
                'cursor-grabbing'
            );
        }
    );

    viewport.addEventListener(
        'pointermove',
        event => {
            if (!view.dragging) return;

            const dx =
                event.clientX - view.lastX;

            const dy =
                event.clientY - view.lastY;

            if (
                Math.abs(dx) > 2 ||
                Math.abs(dy) > 2
            ) {
                view.moved = true;
            }

            view.x += dx;
            view.y += dy;
            view.lastX = event.clientX;
            view.lastY = event.clientY;

            renderMapTransform();
        }
    );

    viewport.addEventListener(
        'pointerup',
        event => {
            if (
                !view.moved &&
                event.altKey &&
                !isLightingMapMode()
            ) {
                logCalibrationPoint(event);
            }

            view.dragging = false;
            view.moved = false;

            viewport.classList.remove(
                'cursor-grabbing'
            );

            viewport.classList.add(
                'cursor-grab'
            );
        }
    );

    zoomIn?.addEventListener(
        'click',
        event => {
            event.stopPropagation();
            zoomMap(0.15);
        }
    );

    zoomOut?.addEventListener(
        'click',
        event => {
            event.stopPropagation();
            zoomMap(-0.15);
        }
    );

    resetView?.addEventListener(
        'click',
        event => {
            event.stopPropagation();
            resetMapView();
            requestCurrentState();
        }
    );

    requestButton?.addEventListener(
        'click',
        openRequestModal
    );

    cancelModalButton?.addEventListener(
        'click',
        closeRequestModal
    );

    confirmModalButton?.addEventListener(
        'click',
        sendSelectedTeleportRequest
    );

    modal?.addEventListener(
        'pointerdown',
        event => {
            if (event.target === modal) {
                closeRequestModal();
            }
        }
    );

    const mapTypeListener = event => {
        const mapType =
            event.detail?.mapType ||
            getActiveMapType();

        resetMapView(mapType);

        if (mapType === 'lighting') {
            state.selectedPointId = null;
            state.status = 'idle';
            state.statusMessage =
                'Teleport controls hidden in Lighting Map';
        } else {
            state.statusMessage =
                state.selectedPointId
                    ? 'Ready to request teleport'
                    : 'No teleport point selected';
        }

        updateOverlayVisibility();
        updateMarkerStates();
        updateSelectedInfo();
    };

    window.addEventListener(
        'map-type-changed',
        mapTypeListener
    );

    cleanupCallbacks.push(() => {
        window.removeEventListener(
            'map-type-changed',
            mapTypeListener
        );
    });

    if (
        typeof subscribeControlMessages ===
        'function'
    ) {
        const unsubscribe =
            subscribeControlMessages(
                handleControlMessage
            );

        if (typeof unsubscribe === 'function') {
            cleanupCallbacks.push(unsubscribe);
        }
    }

    if (
        typeof subscribeControlOpen ===
        'function'
    ) {
        const unsubscribe =
            subscribeControlOpen(
                requestCurrentState
            );

        if (typeof unsubscribe === 'function') {
            cleanupCallbacks.push(unsubscribe);
        }
    }

    renderTeleportPoints();
    clearSelectedInfo();
    renderVrPose();
    resetMapView();
    updateOverlayVisibility();

    const api = {
        getState() {
            return structuredClone(state);
        },

        handleControlMessage,
        requestCurrentState,

        selectPoint,

        clearSelection() {
            state.selectedPointId = null;
            state.status = 'idle';
            state.statusMessage =
                'No teleport point selected';

            updateMarkerStates();
            clearSelectedInfo();
        },

        destroy() {
            cleanupCallbacks.forEach(callback => {
                callback();
            });

            cleanupCallbacks.length = 0;
        }
    };

    window.teleportMapDebug = api;

    return api;
}