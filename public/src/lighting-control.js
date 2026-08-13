import {
    FIXTURE_TYPES,
    FIXTURES,
    getFixturesByType,
    getFixtureById
} from './lighting-fixture.js';

import {
    getFixtureState,
    updateFixtureState,
    buildLightingPayload,
    applyLightingStateSnapshot
} from './lighting-state.js';

import {
    renderFixtureTypeCapsules,
    renderFixtureIdDropdown,
    updatePanelVisibility,
    applyFixturePresetToUI,
    updateSelectedInfoPanel,
    readLightingValuesFromUI,
    writeLightingValuesToUI,
    setupLightingInputListeners
} from './lighting-ui.js';

import {
    subscribeControlMessages,
    subscribeControlOpen
} from './control-channel.js';

import {
    getCues,
    getCueById,
    getEditingCueId,
    setEditingCueId,
    getAppliedCueId,
    setAppliedCueId,
    createCue,
    getFixtureSnapshot,
    upsertFixtureSnapshot,
    removeFixtureFromCue,
    getCuesContainingFixture,
    replaceCueFixtures,
    getCueZeroMeta,
    setCueZeroMeta,
    subscribeCueStore
} from './cue-store.js';

import {
    setupCueEditorUI
} from './cue-editor-ui.js';

const NETWORK_SEND_DEBOUNCE_MS = 40;
const CUE_SAVE_DEBOUNCE_MS = 200;

let lightingController = null;

function deepClone(value) {
    if (value === undefined) return undefined;

    if (typeof globalThis.structuredClone === 'function') {
        return globalThis.structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

export function setupLightingControl(sendControlMessage) {
    let selectedFixtureType = FIXTURE_TYPES.PROFILE;
    let selectedFixture = getFixturesByType(selectedFixtureType)[0] || null;
    let sendTimer = null;
    let hasReceivedUnityLightingSnapshot = false;
    let currentUnitySessionId = null;
    let pendingBaselineRequestId = null;
    let cuePlaybackConfirmationDeadline = 0;
    let cueSaveTimer = null;
    let pendingCueSave = null;

    const cueEditorUi = setupCueEditorUI({
        onSelectCue: handleSelectEditingCue,
        onCreateCue: handleCreateCue,
        onRemoveFixtureFromCue: handleRemoveFixtureFromCue
    });

    function getFixtureLabel(fixture = selectedFixture) {
        if (!fixture) return 'Selected fixture';
        return fixture.displayId || `CH ${fixture.lightId}`;
    }

    function isDetailLightingPageActive() {
        const detailPage =
            document.getElementById(
                'page-light'
            );

        return Boolean(
            detailPage &&
            !detailPage.classList.contains(
                'hidden'
            )
        );
    }

    function enterLiveControlScene() {
        setAppliedCueId(null);
    }

    function exitDetailCueEditing({
        flush = true
    } = {}) {
        if (flush) {
            flushPendingCueSave({
                showStatus: false
            });
        }

        if (getEditingCueId()) {
            setEditingCueId(null);
        }
    }

    function openFixtureFromActiveLightTag(
        fixture
    ) {
        if (!fixture) {
            return;
        }

        selectFixture(
            fixture,
            {
                emit: true,
                source:
                    'footer-active-light',
                send: false
            }
        );

        const lightingPageButton =
            document.querySelector(
                '[data-target="page-light"]'
            );

        if (!lightingPageButton) {
            console.warn(
                '[LightingControl] Lighting Control navigation button not found.'
            );

            return;
        }

        lightingPageButton.click();
    }

    function renderActiveLightTags(){
        const tagContainer = document.getElementById('activeLightTags');
        const countElement = document.getElementById('activeLightCount');

        if (!tagContainer) return;

        tagContainer.innerHTML = '';
        if (!hasReceivedUnityLightingSnapshot) {
            if (countElement) {
                countElement.textContent = '--';
            }

            const syncingLabel = document.createElement('span');
            syncingLabel.className = ['text-[11px]', 'text-gray-500'].join(' ');
            syncingLabel.textContent = 'Syncing Unity lights...';
            tagContainer.appendChild(syncingLabel);
            return;
        }

        const activeFixtures = FIXTURES.filter(fixture => { const state = getFixtureState(fixture);
            if (!state) return false;
            return state.isOn === true
        });

        if (countElement) {countElement.textContent = String(activeFixtures.length);}
        if (activeFixtures.length === 0) {const emptyLabel = document.createElement('span');
            emptyLabel.className = ['text-[11px]', 'text-gray-500'].join(' ');
            emptyLabel.textContent = 'No active lights';
            tagContainer.appendChild(emptyLabel);
            return;
        }

        activeFixtures.sort((a, b) => Number(a.lightId) - Number(b.lightId)).forEach(fixture => {const tag = document.createElement('button');
            tag.type = 'button';
            tag.dataset.lightId = String(fixture.lightId);
            tag.className = [
                'shrink-0',
                'inline-flex',
                'items-center',
                'justify-center',
                'rounded-full',
                'border',
                'border-emerald-400/40',
                'bg-emerald-400/10',
                'px-2',
                'py-0.5',
                'text-[11px]',
                'font-semibold',
                'font-mono',
                'text-emerald-300',

                'cursor-pointer',
                'transition',
                'hover:border-blue-400/60',
                'hover:bg-blue-500/15',
                'hover:text-blue-200',
                'active:scale-[0.96]'
            ].join(' ');
            tag.textContent = String(fixture.lightId);
            tag.title = `Open Light ${fixture.lightId}`;
            tag.setAttribute('aria-label', `Open lighting control for Light ${fixture.lightId}`);
            tag.addEventListener(
                'click',
                event => {
                    event.preventDefault();
                    event.stopPropagation();

                    openFixtureFromActiveLightTag(
                        fixture
                    );
                }
            );
            tagContainer.appendChild(tag);
        });
    }

    function renderCurrentCueEditor() {
        const includedCues = selectedFixture
            ? getCuesContainingFixture(selectedFixture.lightId)
            : [];

        cueEditorUi.render({
            cues: getCues(),
            editingCueId: getEditingCueId(),
            includedCues,
            selectedFixture
        });
    }

    function normalizeColorTo255(
        value,
        fallback = 255
        ) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        // 网络 Payload 颜色范围。
        if (number >= 0 && number <= 1) {
            return Math.round(number * 255);
        }

        // 兼容旧数据中已经是 0–255 的情况。
        return Math.round(
            Math.max(
                0,
                Math.min(255, number)
            )
        );
    }

    function snapshotToFixtureState(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return {};
        }

        const state = deepClone(snapshot);

        if (state.r !== undefined) {
            state.r = normalizeColorTo255(
                state.r,
                255
            );
        }

        if (state.g !== undefined) {
            state.g = normalizeColorTo255(
                state.g,
                255
            );
        }

        if (state.b !== undefined) {
            state.b = normalizeColorTo255(
                state.b,
                255
            );
        }

        if (Array.isArray(state.segments)) {
            state.segments = state.segments.map(color => ({
                r: normalizeColorTo255(
                    color?.r,
                    255
                ),

                g: normalizeColorTo255(
                    color?.g,
                    255
                ),

                b: normalizeColorTo255(
                    color?.b,
                    255
                )
            }));
        }

        return state;
    }


    function renderAll() {
        renderFixtureTypeCapsules({
            selectedFixtureType,
            onSelectType: handleSelectType
        });

        renderFixtureIdDropdown({
            selectedFixtureType,
            selectedFixture,
            onSelectFixture: handleSelectFixture
        });

        updatePanelVisibility(selectedFixtureType, selectedFixture);

        if (!selectedFixture) {
            renderActiveLightTags();
            renderCurrentCueEditor();
            return;
        }
        applyFixturePresetToUI(selectedFixture);

        const fixtureState = getFixtureState(selectedFixture);
        writeLightingValuesToUI(fixtureState, selectedFixture);

        updateSelectedInfoPanel(selectedFixture);
        renderActiveLightTags();
        renderCurrentCueEditor();
    }

    function buildPayloadFromFixtureState(fixture, fixtureState) {
        if (!fixture || !fixtureState) return null;

        return deepClone(
            buildLightingPayload(fixture, fixtureState)
        );
    }

    function captureCurrentFixtureSnapshot() {
        if (!selectedFixture) return null;

        const uiState = readLightingValuesFromUI(selectedFixture);
        const nextState = updateFixtureState(
            selectedFixture,
            uiState
        );

        return buildPayloadFromFixtureState(
            selectedFixture,
            nextState
        );
    }

    function sendLightingPayload(payload) {
        if (!payload) return;

        console.log('[WebLightingSend]', {
            lightId: payload.lightId,
            type: payload.fixtureType,
            model: payload.fixtureModel,
            isOn: payload.isOn,
            intensity: payload.intensity,
            fieldAngle: payload.fieldAngle,
            beamSize: payload.beamSize,
            pan: payload.pan,
            tilt: payload.tilt
        });

        sendControlMessage('lighting-fixture', payload);
        renderActiveLightTags();
    }

    function sendCurrentFixtureState() {
        const payload = captureCurrentFixtureSnapshot();
        sendLightingPayload(payload);
    }

    function scheduleSendFixtureState(nextState) {
        if (!selectedFixture || !nextState) return;

        const payload = buildPayloadFromFixtureState(
            selectedFixture,
            nextState
        );

        clearTimeout(sendTimer);
        sendTimer = setTimeout(() => {
            sendLightingPayload(payload);
        }, NETWORK_SEND_DEBOUNCE_MS);
    }

    function scheduleCueSnapshotSave(nextState) {
        const editingCueId = getEditingCueId();

        if (!isDetailLightingPageActive() || !editingCueId || !selectedFixture || !nextState) {
            return;
        }

        pendingCueSave = {
            cueId: editingCueId,
            lightId: selectedFixture.lightId,
            fixtureLabel: getFixtureLabel(),
            snapshot: buildPayloadFromFixtureState(
                selectedFixture,
                nextState
            )
        };

        clearTimeout(cueSaveTimer);
        cueSaveTimer = setTimeout(() => {
            flushPendingCueSave({ showStatus: true });
        }, CUE_SAVE_DEBOUNCE_MS);
    }

    function flushPendingCueSave({ showStatus = false } = {}) {
        clearTimeout(cueSaveTimer);
        cueSaveTimer = null;

        if (!pendingCueSave) return false;

        const save = pendingCueSave;
        pendingCueSave = null;

        const cue = getCueById(save.cueId);
        if (!cue) {
            console.warn('[LightingControl] Pending Cue save discarded; Cue not found:', save.cueId);
            return false;
        }

        upsertFixtureSnapshot(
            save.cueId,
            save.lightId,
            save.snapshot
        );

        if (showStatus) {
            cueEditorUi.setStatus(
                `${save.fixtureLabel} saved to Cue ${cue.cueNumber}.`,
                { tone: 'success', duration: 900 }
            );
        }

        return true;
    }

    function handleSelectType(nextType) {
        const firstFixtureOfType = getFixturesByType(nextType)[0] || null;

        if (!firstFixtureOfType) {
            flushPendingCueSave();
            selectedFixtureType = nextType;
            selectedFixture = null;
            setEditingCueId(null);
            renderAll();
            return;
        }

        selectFixture(firstFixtureOfType, {
            emit: true,
            source: 'lighting-control',
            send: false
        });
    }

    function handleSelectFixture(fixture) {
        selectFixture(fixture, {
            emit: true,
            source: 'lighting-control',
            send: false
        });
    }

    function handleSelectEditingCue(cueId) {
        if (!selectedFixture) return;
        
        const normalizedCueId = cueId || null;
        const currentEditingCueId = getEditingCueId();

        if (normalizedCueId === currentEditingCueId) {
            renderCurrentCueEditor();
            return;
        }

        flushPendingCueSave({ showStatus: false });

        if (!normalizedCueId) {
            setEditingCueId(null);
            renderCurrentCueEditor();

            cueEditorUi.setStatus(
                'Live Control — changes are not saved to a Cue.',
                { tone: 'neutral', duration: 2200 }
            );
            return;
        }

        const cue = getCueById(normalizedCueId);
        if (!cue) {
            cueEditorUi.setStatus('The selected Cue no longer exists.', {
                tone: 'error',
                duration: 3000
            });
            renderCurrentCueEditor();
            return;
        }

        setEditingCueId(
            cue.id,
        );
        enterLiveControlScene();

        const savedSnapshot = getFixtureSnapshot(cue.id, selectedFixture.lightId);

        if (!savedSnapshot) {
            const currentSnapshot = captureCurrentFixtureSnapshot();

            upsertFixtureSnapshot(
                cue.id,
                selectedFixture.lightId,
                currentSnapshot
            );

            renderAll();

            cueEditorUi.setStatus(
                `${getFixtureLabel()} added to Cue ${cue.cueNumber} using the current fixture settings.`,
                { tone: 'success', duration: 2600 }
            );
            return;
        }

        const nextState = updateFixtureState(
            selectedFixture,
            snapshotToFixtureState(savedSnapshot)
        );

        renderAll();

        sendLightingPayload(
            buildPayloadFromFixtureState(selectedFixture, nextState)
        );

        cueEditorUi.setStatus(
            `Editing Cue ${cue.cueNumber} — ${cue.name}. Live preview is active.`,
            { tone: 'neutral', duration: 1800 }
        );
    }

    function handleCreateCue({ name }) {
        if (!selectedFixture) {
            throw new Error('Select a fixture before creating a Cue.');
        }

        flushPendingCueSave({ showStatus: false });

        const fixtureSnapshot = captureCurrentFixtureSnapshot();
        const cue = createCue({
            name,
            lightId: selectedFixture.lightId,
            fixtureSnapshot
        });

        setEditingCueId(cue.id);
        enterLiveControlScene();
        renderAll();

        cueEditorUi.setStatus(
            `Cue ${cue.cueNumber} created. ${getFixtureLabel()} is now included.`,
            { tone: 'success', duration: 2600 }
        );

        return cue;
    }

    function handleRemoveFixtureFromCue(cueId) {
        if (!selectedFixture) return false;

        flushPendingCueSave({ showStatus: false });

        const cue = getCueById(cueId);

        if (!cue) {
            throw new Error('The selected Cue no longer exists.');
        }

        if (Number(cue.cueNumber) === 0) {
            throw new Error(
                'Fixtures cannot be removed from Cue 0.'
            );
        }        

        const wasEditingCue = String(getEditingCueId()) === String(cue.id);
        const removed = removeFixtureFromCue(
            cue.id,
            selectedFixture.lightId
        );

        if (!removed) {
            throw new Error(
                `${getFixtureLabel()} is not included in Cue ${cue.cueNumber}.`
            );
        }

        if (wasEditingCue) {
            setEditingCueId(null);
        }

        renderCurrentCueEditor();

        cueEditorUi.setStatus(
            `${getFixtureLabel()} removed from Cue ${cue.cueNumber}.` +
            (wasEditingCue ? ' Switched to Live Control.' : ''),
            { tone: 'success', duration: 2600 }
        );

        return true;
    }

    function requestUnityLightingState(
        reason = 'manual'
    ) {
        sendControlMessage('request-lighting-state', {
            reason,
            requestedAt: Date.now()
        });

        console.log(
            '[LightingControl] Requested Unity live lighting state:',
            {
                reason
            }
        );
    }

    function requestUnityLightingSession(reason = 'manual') {
        sendControlMessage('request-lighting-session', {
            reason,
            requestedAt: Date.now()
        });

        console.log(
            '[LightingControl] Requested Unity lighting session:',
            {
                reason
            }
        );
    }

    function createBaselineRequestId() {
        if (
            typeof globalThis.crypto
                ?.randomUUID ===
            'function'
        ) {
            return globalThis.crypto
                .randomUUID();
        }

        return (
            'baseline-' +
            Date.now() +
            '-' +
            Math.random()
                .toString(36)
                .slice(2)
        );
    }

    function requestUnityLightingBaseline(
        sessionId
    ) {
        const normalizedSessionId =
            String(
                sessionId || ''
            );

        if (!normalizedSessionId) {
            console.warn(
                '[LightingBaseline] Cannot request baseline without sessionId.'
            );

            return;
        }

        const requestId =
            createBaselineRequestId();

        pendingBaselineRequestId =
            requestId;

        sendControlMessage(
            'request-lighting-baseline',
            {
                sessionId:
                    normalizedSessionId,

                requestId,

                requestedAt:
                    Date.now()
            }
        );

        console.log(
            '[LightingBaseline] Requested startup baseline:',
            {
                sessionId:
                    normalizedSessionId,

                requestId
            }
        );
    }

    function handleLightingSession(
        message
    ) {
        const payload =
            message?.payload;

        const sessionId =
            String(
                payload?.sessionId ||
                ''
            );

        const baselineReady =
            payload?.baselineReady ===
            true;

        if (!sessionId) {
            console.warn(
                '[LightingSession] Invalid lighting-session message:',
                message
            );

            return;
        }

        currentUnitySessionId =
            sessionId;

        const cueZeroMeta =
            getCueZeroMeta();

        const storedSessionId =
            cueZeroMeta
                ?.sourceSessionId
                ? String(
                    cueZeroMeta
                        .sourceSessionId
                )
                : null;

        console.log(
            '[LightingSession] Unity session received:',
            {
                currentSessionId:
                    sessionId,

                storedCueZeroSessionId:
                    storedSessionId,

                baselineReady
            }
        );

        if (
            storedSessionId ===
            sessionId
        ) {
            pendingBaselineRequestId =
                null;

            requestUnityLightingState(
                'same-unity-session'
            );

            return;
        }

        if (baselineReady) {
            requestUnityLightingBaseline(
                sessionId
            );

            return;
        }

        window.setTimeout(
            () => {
                if (
                    currentUnitySessionId ===
                    sessionId &&
                    !pendingBaselineRequestId
                ) {
                    requestUnityLightingSession(
                        'baseline-not-ready-retry'
                    );
                }
            },
            250
        );
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(
            object,
            key
        );
    }

    function getCueZeroInitializationFixtures(fixtures) {
        const uniqueFixturesById = new Map();
        const unknownUnityIds = [];
        const invalidUnityIds = [];

        fixtures.forEach(item => {
            const lightId =
                Number(item?.lightId);

            if (!Number.isFinite(lightId)) {
                invalidUnityIds.push(
                    item?.lightId
                );
                return;
            }

            if (!getFixtureById(lightId)) {
                unknownUnityIds.push(
                    lightId
                );
                return;
            }

            uniqueFixturesById.set(
                lightId,
                item
            );
        });

        return {
            canRefresh:
                fixtures.length > 0,
            fixtures: [
                ...uniqueFixturesById.values()
            ],
            rawUnityCount:
                fixtures.length,
            alignedFixtureCount:
                uniqueFixturesById.size,
            unknownUnityIds: [
                ...new Set(unknownUnityIds)
            ],
            invalidUnityIds
        };
    }

    function buildCueZeroSnapshots(fixtures) {
        const snapshots = {};

        fixtures.forEach(item => {
            const fixture =
                getFixtureById(item.lightId);

            if (!fixture) return;

            const state =
                getFixtureState(fixture);

            const payload =
                buildPayloadFromFixtureState(
                    fixture,
                    state
                );

            if (payload) {
                snapshots[
                    String(fixture.lightId)
                ] = payload;
            }
        });

        return snapshots;
    }

    function refreshCueZeroFromUnity(
        fixtures,
        {
            resetSelection = false
        } = {}
    ) {
        const cueZero = getCues().find(
            cue =>
                Number(cue.cueNumber) === 0
        );

        if (!cueZero) {
            console.error(
                '[LightingControl] Cue 0 not found; ' +
                'Unity initialization could not be persisted.'
            );

            return {
                refreshed: false,
                cueId: null,
                fixtureCount: 0,
                activeFixtureCount: 0,
                rawUnityCount: 0,
                alignedFixtureCount: 0,
                unknownUnityIds: [],
                invalidUnityIds: []
            };
        }

        const initialization =
            getCueZeroInitializationFixtures(
                fixtures
            );

        if (!initialization.canRefresh) {
            console.warn(
                '[LightingControl] Unity returned an empty lighting snapshot; ' +
                'Cue 0 was kept unchanged.'
            );

            const existingSnapshots =
                Object.values(
                    cueZero.fixtures || {}
                );

            const existingActiveCount =
                existingSnapshots.filter(
                    snapshot => (
                        snapshot?.isOn === true ||
                        snapshot?.isOn === 'true' ||
                        snapshot?.isOn === 1 ||
                        snapshot?.isOn === '1'
                    )
                ).length;

            return {
                refreshed: false,
                cueId: cueZero.id,
                fixtureCount:
                    existingSnapshots.length,
                activeFixtureCount:
                    existingActiveCount,
                rawUnityCount: 0,
                alignedFixtureCount: 0,
                unknownUnityIds: [],
                invalidUnityIds: []
            };
        }

        const cueZeroSnapshots =
            buildCueZeroSnapshots(
                initialization.fixtures
            );

        replaceCueFixtures(
            cueZero.id,
            cueZeroSnapshots,
            {
                preserveSavedPriority: true
            }
        );

        const storedSnapshots =
            Object.values(
                cueZeroSnapshots
            );

        const storedFixtureCount =
            storedSnapshots.length;

        const activeFixtureCount =
            storedSnapshots.filter(
                snapshot => (
                    snapshot?.isOn === true ||
                    snapshot?.isOn === 'true' ||
                    snapshot?.isOn === 1 ||
                    snapshot?.isOn === '1'
                )
            ).length;

        window.dispatchEvent(
            new CustomEvent(
                'cue-zero-refreshed',
                {
                    detail: {
                        cueId: cueZero.id,
                        fixtureCount:
                            storedFixtureCount,
                        activeFixtureCount,
                        rawUnityCount:
                            initialization.rawUnityCount,
                        alignedFixtureCount:
                            initialization.alignedFixtureCount,
                        unknownUnityIds:
                            initialization.unknownUnityIds,
                        invalidUnityIds:
                            initialization.invalidUnityIds,
                        resetSelection
                    }
                }
            )
        );

        if (
            initialization.unknownUnityIds.length > 0
        ) {
            console.warn(
                '[LightingControl] Unity fixtures missing from Web FIXTURES:',
                initialization.unknownUnityIds
            );
        }

        if (
            initialization.invalidUnityIds.length > 0
        ) {
            console.warn(
                '[LightingControl] Invalid lightIds in Unity snapshot:',
                initialization.invalidUnityIds
            );
        }

        return {
            refreshed: true,
            cueId: cueZero.id,
            fixtureCount:
                storedFixtureCount,
            activeFixtureCount,
            rawUnityCount:
                initialization.rawUnityCount,
            alignedFixtureCount:
                initialization.alignedFixtureCount,
            unknownUnityIds:
                initialization.unknownUnityIds,
            invalidUnityIds:
                initialization.invalidUnityIds
        };
    }

    function handleUnityLightingBaselineSnapshot(
        message
    ) {
        const payload =
            message?.payload;

        const fixtures =
            payload?.fixtures;

        const sessionId =
            String(
                payload?.sessionId ||
                ''
            );

        const requestId =
            String(
                payload?.requestId ||
                ''
            );

        if (!Array.isArray(fixtures)) {
            console.warn(
                '[LightingBaseline] Invalid baseline snapshot:',
                message
            );

            return;
        }

        if (
            !sessionId ||
            sessionId !==
                currentUnitySessionId
        ) {
            console.warn(
                '[LightingBaseline] Ignored baseline from stale Unity session:',
                {
                    responseSessionId:
                        sessionId,

                    currentUnitySessionId
                }
            );

            return;
        }

        if (
            !pendingBaselineRequestId ||
            requestId !==
                pendingBaselineRequestId
        ) {
            console.warn(
                '[LightingBaseline] Ignored stale baseline response:',
                {
                    responseRequestId:
                        requestId,

                    pendingRequestId:
                        pendingBaselineRequestId
                }
            );

            return;
        }

        pendingBaselineRequestId =
            null;

        flushPendingCueSave({
            showStatus: false
        });

        const appliedCount =
            applyLightingStateSnapshot(
                fixtures,
                FIXTURES
            );

        const cueZeroResult =
            refreshCueZeroFromUnity(
                fixtures,
                {
                    resetSelection:
                        true
                }
            );

        if (!cueZeroResult?.refreshed) {
            console.warn(
                '[LightingBaseline] Cue 0 was not refreshed. Session metadata was not saved.'
            );

            return;
        }

        setCueZeroMeta({
            sourceSessionId:
                sessionId,

            capturedAt:
                Date.now()
        });

        setEditingCueId(null);

        hasReceivedUnityLightingSnapshot =
            true;

        console.log(
            '[LightingBaseline] Startup baseline applied:',
            {
                sessionId,
                requestId,
                appliedCount,
                cueZero:
                    cueZeroResult
            }
        );

        renderAll();

        window.dispatchEvent(
            new CustomEvent(
                'cue-zero-ready-for-initial-apply',
                {
                    detail: {
                        cueId:
                            cueZeroResult.cueId,

                        sessionId
                    }
                }
            )
        );
    }

    function handleUnityLightingStateSnapshot(message) {
        const fixtures =
            message?.payload?.fixtures;

        if (!Array.isArray(fixtures)) {
            console.warn(
                '[LightingControl] Invalid lighting-state-snapshot:',
                message
            );
            return;
        }

        const now = Date.now();
        const isCuePlaybackSnapshot =
            now <=
            cuePlaybackConfirmationDeadline;

        if (isCuePlaybackSnapshot) {
            const appliedCount =
                applyLightingStateSnapshot(
                    fixtures,
                    FIXTURES
                );

            hasReceivedUnityLightingSnapshot =
                true;

            console.log(
                '[LightingControl] Cue playback snapshot applied:',
                appliedCount
            );

            renderAll();
            return;
        }

        const appliedCount =
            applyLightingStateSnapshot(
                fixtures,
                FIXTURES
            );

        hasReceivedUnityLightingSnapshot =
            true;

        console.log(
            '[LightingControl] Unity live snapshot applied:',
            appliedCount
        );

        renderAll();
    }

    function findFixtureById(lightId) {
        return getFixtureById(lightId) || null;
    }

    function selectFixtureById(lightId, {
        emit = true,
        source = 'lighting-control',
        send = true
    } = {}) {
        const fixture = findFixtureById(lightId);

        if (!fixture) {
            console.warn('[LightingControl] fixture not found:', lightId);
            return;
        }

        selectFixture(fixture, {
            emit,
            source,
            send
        });
    }

    function dispatchSelectedFixture(fixture, source = 'lighting-control') {
        if (!fixture) return;

        window.dispatchEvent(new CustomEvent('lighting-fixture-selected', {
            detail: {
                lightId: fixture.lightId,
                source
            }
        }));
    }

    function selectFixture(fixture, {
        emit = true,
        source = 'lighting-control',
        send = true
    } = {}) {
        if (!fixture) return;

        const isDifferentFixture = !selectedFixture ||
            Number(selectedFixture.lightId) !== Number(fixture.lightId);

        if (isDifferentFixture) {
            flushPendingCueSave({ showStatus: false });
            setEditingCueId(null);
        }

        selectedFixture = fixture;
        selectedFixtureType = fixture.fixtureType;
        renderAll();

        if(emit) dispatchSelectedFixture(fixture, source);
        if(send) sendCurrentFixtureState();
    }

    window.addEventListener('lighting-fixture-selected', event => {
        const lightId = event.detail?.lightId;
        const source = event.detail?.source;

        if (lightId == null) return;
        if (source === 'lighting-control' || source === 'footer-active-light') return;

        selectFixtureById(lightId, {
            emit: false,
            source,
            send: false
        });
    });

    setupLightingInputListeners((options = {}) => {
        if (!selectedFixture) return;

        const uiState = readLightingValuesFromUI(selectedFixture);
        const nextState = updateFixtureState(
            selectedFixture,
            uiState
        );

        enterLiveControlScene();
        scheduleCueSnapshotSave(nextState);
        scheduleSendFixtureState(nextState);

        if (options.render) {
            renderAll();
        } else {
            renderActiveLightTags();
        }
    });

    window.addEventListener(
        'cue-playback-state-requested',
        event => {
            const expectedDurationMs =
                Number(
                    event.detail?.expectedDurationMs
                );

            const playbackWindowMs =
                Number.isFinite(
                    expectedDurationMs
                )
                    ? Math.max(
                        5000,
                        expectedDurationMs + 2000
                    )
                    : 5000;

            cuePlaybackConfirmationDeadline =
                Date.now() +
                playbackWindowMs;
        }
    );

    subscribeControlOpen(() => {
        requestUnityLightingSession(
            'control-channel-open'
        );
    });

    subscribeControlMessages(message => {
        if (!message) {
            return;
        }

        switch (message.type) {
            case 'lighting-session':
                handleLightingSession(
                    message
                );
                return;

            case 'lighting-baseline-snapshot':
                handleUnityLightingBaselineSnapshot(
                    message
                );
                return;

            case 'lighting-state-snapshot':
                handleUnityLightingStateSnapshot(
                    message
                );
                return;

            default:
                return;
            }
    });

    subscribeCueStore(() => {
        renderCurrentCueEditor();
    });

    setTimeout(() => {
        if (!currentUnitySessionId) {
            requestUnityLightingSession(
                'setup-delayed'
            );
        }
    }, 800);
    
    document.addEventListener(
        'click',
        event => {
            const navigationButton =
                event.target.closest(
                    '[data-target]'
                );

            const targetPage =
                navigationButton?.dataset
                    ?.target;

            if (
                targetPage &&
                targetPage !== 'page-light'
            ) {
                exitDetailCueEditing({
                    flush: true
                });
            }
        }
    );

    window.addEventListener('beforeunload', () => {
        flushPendingCueSave({ showStatus: false });
    });

    lightingController = {
        selectFixtureById,
        getSelectedFixture: () => selectedFixture,
        getSelectedFixtureType: () => selectedFixtureType,
        getEditingCueId,
        getAppliedCueId,
        flushPendingCueSave
    };

    renderAll();
}

export function selectLightingFixtureById(lightId) {
    if (!lightingController) {
        console.warn('[LightingControl] controller is not ready yet');
        return;
    }

    lightingController.selectFixtureById(lightId, {
        emit: true,
        source: 'external',
        send: false
    });
}

export function getSelectedLightingFixture() {
    return lightingController?.getSelectedFixture() || null;
}

export function getSelectedLightingFixtureType() {
    return lightingController?.getSelectedFixtureType() || null;
}

export function getCurrentEditingCueId() {
    return lightingController?.getEditingCueId() || null;
}

export function flushLightingCueEdits() {
    lightingController?.flushPendingCueSave({ showStatus: false });
}