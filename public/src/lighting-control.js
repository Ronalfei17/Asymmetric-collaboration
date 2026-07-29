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
    createCue,
    getFixtureSnapshot,
    upsertFixtureSnapshot,
    removeFixtureFromCue,
    getCuesContainingFixture,
    getLastSavedCueIdForFixture,
    replaceCueFixtures,
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
    let awaitingUnityBaselineSnapshot = true;
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

        activeFixtures.forEach(fixture => {const tag = document.createElement('span');
            tag.className = [
                'shrink-0',
                'inline-flex',
                'items-center',
                'rounded-full',
                'border',
                'border-emerald-400/40',
                'bg-emerald-400/10',
                'px-2',
                'py-0.5',
                'text-[11px]',
                'font-semibold',
                'text-emerald-300',
                'cursor-default'
            ].join(' ');
            tag.textContent = fixture.displayId || `CH ${fixture.lightId}`;
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

    function restoreLastSavedCueForFixture(fixture) {
        if (!fixture) return null;

        const includedCues = getCuesContainingFixture(fixture.lightId);

        if (includedCues.length === 0) {
            setEditingCueId(null);
            return null;
        }

        let preferredCueId = getLastSavedCueIdForFixture(fixture.lightId);

        if (!preferredCueId) {
            preferredCueId = [...includedCues]
                .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))[0]
                ?.id || null;
        }

        const preferredCue = preferredCueId
            ? getCueById(preferredCueId)
            : null;

        const savedSnapshot = preferredCue
            ? getFixtureSnapshot(preferredCue.id, fixture.lightId)
            : null;

        if (!preferredCue || !savedSnapshot) {
            setEditingCueId(null);
            return null;
        }

        const nextState = updateFixtureState(
            fixture,
            snapshotToFixtureState(savedSnapshot)
        );

        setEditingCueId(preferredCue.id);

        return {
            cue: preferredCue,
            nextState,
            payload: buildPayloadFromFixtureState(fixture, nextState)
        };
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

        if (!editingCueId || !selectedFixture || !nextState) {
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

        const savedSnapshot = getFixtureSnapshot(
            cue.id,
            selectedFixture.lightId
        );

        if (!savedSnapshot) {
            const currentSnapshot = captureCurrentFixtureSnapshot();

            upsertFixtureSnapshot(
                cue.id,
                selectedFixture.lightId,
                currentSnapshot
            );

            setEditingCueId(cue.id);
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

        setEditingCueId(cue.id);
        renderAll();

        sendLightingPayload(
            buildPayloadFromFixtureState(selectedFixture, nextState)
        );

        cueEditorUi.setStatus(
            `Editing Cue ${cue.cueNumber} — ${cue.name}.`,
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
        reason = 'manual',
        {
            baseline = false
        } = {}
    ) {
        if (baseline) {
            awaitingUnityBaselineSnapshot = true;
        }

        sendControlMessage('request-lighting-state', {
            reason,
            requestedAt: Date.now()
        });

        console.log(
            '[LightingControl] Requested Unity lighting state:',
            {
                reason,
                baseline
            }
        );
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(
            object,
            key
        );
    }

    function isUnityFixtureOk(item) {
        const value =
            hasOwn(item || {}, 'isOk')
                ? item.isOk
                : item?.isOK;

        return (
            value === true ||
            value === 'true' ||
            value === 1 ||
            value === '1'
        );
    }

    function getCueZeroInitializationFixtures(fixtures) {
        const hasExplicitIsOk =
            fixtures.some(item => (
                hasOwn(item || {}, 'isOk') ||
                hasOwn(item || {}, 'isOK')
            ));

        if (!hasExplicitIsOk) {
            console.error(
                '[LightingControl] Cue 0 was not refreshed because the Unity ' +
                'lighting-state-snapshot contains no isOk/isOK field.'
            );

            return {
                canRefresh: false,
                fixtures: [],
                rawIsOkCount: 0,
                unknownIsOkIds: []
            };
        }

        const uniqueFixturesById = new Map();
        const unknownIsOkIds = [];
        let rawIsOkCount = 0;

        fixtures.forEach(item => {
            if (!item || !isUnityFixtureOk(item)) {
                return;
            }

            rawIsOkCount += 1;

            const lightId = Number(item.lightId);

            if (!Number.isFinite(lightId)) {
                return;
            }

            if (!getFixtureById(lightId)) {
                unknownIsOkIds.push(lightId);
                return;
            }

            // Deduplicate repeated lightIds so the stored Cue count matches
            // the number of fixture snapshots in Cue 0.
            uniqueFixturesById.set(
                lightId,
                item
            );
        });

        return {
            canRefresh: true,
            fixtures: [
                ...uniqueFixturesById.values()
            ],
            rawIsOkCount,
            unknownIsOkIds: [
                ...new Set(unknownIsOkIds)
            ]
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
                rawIsOkCount: 0,
                unknownIsOkIds: []
            };
        }

        const initialization =
            getCueZeroInitializationFixtures(
                fixtures
            );

        if (!initialization.canRefresh) {
            return {
                refreshed: false,
                cueId: cueZero.id,
                fixtureCount:
                    Object.keys(
                        cueZero.fixtures || {}
                    ).length,
                rawIsOkCount: 0,
                unknownIsOkIds: []
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

        const storedFixtureCount =
            Object.keys(
                cueZeroSnapshots
            ).length;

        window.dispatchEvent(
            new CustomEvent(
                'cue-zero-refreshed',
                {
                    detail: {
                        cueId: cueZero.id,
                        fixtureCount:
                            storedFixtureCount,
                        rawIsOkCount:
                            initialization.rawIsOkCount,
                        unknownIsOkIds:
                            initialization.unknownIsOkIds,
                        resetSelection
                    }
                }
            )
        );

        if (
            initialization.unknownIsOkIds.length > 0
        ) {
            console.warn(
                '[LightingControl] Some Unity isOk fixtures are missing from Web FIXTURES:',
                initialization.unknownIsOkIds
            );
        }

        return {
            refreshed: true,
            cueId: cueZero.id,
            fixtureCount:
                storedFixtureCount,
            rawIsOkCount:
                initialization.rawIsOkCount,
            unknownIsOkIds:
                initialization.unknownIsOkIds
        };
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

            // Keep both the homepage Cue selection and the detail-page
            // Editing Cue while the Cue playback window is active.
            renderAll();
            return;
        }

        if (awaitingUnityBaselineSnapshot) {
            flushPendingCueSave({
                showStatus: false
            });

            setEditingCueId(null);

            // The live Web state follows the complete Unity snapshot.
            const appliedCount =
                applyLightingStateSnapshot(
                    fixtures,
                    FIXTURES
                );

            // Cue 0 stores only the unique, Web-known isOk fixtures.
            const cueZeroResult =
                refreshCueZeroFromUnity(
                    fixtures,
                    {
                        resetSelection: true
                    }
                );

            awaitingUnityBaselineSnapshot =
                false;

            hasReceivedUnityLightingSnapshot =
                true;

            console.log(
                '[LightingControl] Unity baseline applied:',
                {
                    appliedCount,
                    cueZero: cueZeroResult
                }
            );

            renderAll();
            return;
        }

        // A normal live snapshot updates the controls only.
        // It must not clear Editing Cue or force the homepage back to Cue 0.
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

        let restoredCueContext = null;

        if (isDifferentFixture) {
            flushPendingCueSave({ showStatus: false });
            selectedFixture = fixture;
            selectedFixtureType = fixture.fixtureType;
            restoredCueContext = restoreLastSavedCueForFixture(fixture);
        } else {
            selectedFixture = fixture;
            selectedFixtureType = fixture.fixtureType;
        }
        renderAll();

        if(emit) dispatchSelectedFixture(fixture, source);
        if (restoredCueContext) {
            sendLightingPayload(restoredCueContext.payload);
            cueEditorUi.setStatus(
                `Restored Cue ${restoredCueContext.cue.cueNumber} — ${restoredCueContext.cue.name} for ${getFixtureLabel(fixture)}.`,
                { tone: 'neutral', duration: 1800 }
            );
            return;
        }

        if(send) sendCurrentFixtureState();
    }

    window.addEventListener('lighting-fixture-selected', event => {
        const lightId = event.detail?.lightId;
        const source = event.detail?.source;

        if (lightId == null) return;
        if (source === 'lighting-control') return;

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
        () => {
            // Keep the full window active. Multiple Unity snapshots can arrive
            // while a multi-fixture Cue is being applied.
            cuePlaybackConfirmationDeadline =
                Date.now() + 5000;
        }
    );

    subscribeControlOpen(() => {
        requestUnityLightingState(
            'control-channel-open',
            {
                baseline: true
            }
        );
    });

    subscribeControlMessages(message => {
        if (!message || message.type !== 'lighting-state-snapshot') {
            return;
        }

        handleUnityLightingStateSnapshot(message);
    });

    subscribeCueStore(() => {
        renderCurrentCueEditor();
    });

    setTimeout(() => {
        if (!hasReceivedUnityLightingSnapshot) {
            requestUnityLightingState(
                'setup-delayed',
                {
                    baseline: true
                }
            );
        }
    }, 800);

    window.addEventListener('beforeunload', () => {
        flushPendingCueSave({ showStatus: false });
    });

    lightingController = {
        selectFixtureById,
        getSelectedFixture: () => selectedFixture,
        getSelectedFixtureType: () => selectedFixtureType,
        getEditingCueId,
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