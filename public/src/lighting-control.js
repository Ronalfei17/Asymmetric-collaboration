import {
    FIXTURE_TYPES,
    getFixturesByType,
    getFixtureById
} from './lighting-fixture.js';

import {
    getFixtureState,
    updateFixtureState,
    buildLightingPayload
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

let lightingController = null;

export function setupLightingControl(sendControlMessage) {
    let selectedFixtureType = FIXTURE_TYPES.PROFILE;
    let selectedFixture = getFixturesByType(selectedFixtureType)[0] || null;
    let sendTimer = null;

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

        if (!selectedFixture) return;

        applyFixturePresetToUI(selectedFixture);

        const fixtureState = getFixtureState(selectedFixture);
        writeLightingValuesToUI(fixtureState);

        updateSelectedInfoPanel(selectedFixture);
    }

    function handleSelectType(nextType) {
        selectedFixtureType = nextType;
        selectedFixture = getFixturesByType(nextType)[0] || null;
        renderAll();
        sendCurrentFixtureState();
    }

    function handleSelectFixture(fixture) {
        selectedFixture = fixture;
        renderAll();
        sendCurrentFixtureState();
    }

    function sendCurrentFixtureState() {
        if (!selectedFixture) return;

        const uiState = readLightingValuesFromUI();

        const nextState = updateFixtureState(
            selectedFixture,
            uiState
        );

        const payload = buildLightingPayload(
            selectedFixture,
            nextState
        );

        sendControlMessage('lighting-fixture', payload);
    }

    function scheduleSendCurrentFixtureState() {
        clearTimeout(sendTimer);

        sendTimer = setTimeout(() => {
            sendCurrentFixtureState();
        }, 40);
    }

    function findFixtureById(lightId) {
        return getFixtureById(lightId) || null;
    }

    function selectFixtureById(lightId) {
        const fixture = findFixtureById(lightId);

        if (!fixture) {
            console.warn('[LightingControl] fixture not found:', lightId);
            return;
        }

        selectedFixtureType = fixture.fixtureType;
        selectedFixture = fixture;

        renderAll();
        sendCurrentFixtureState();
    }

    setupLightingInputListeners(() => {
        if (!selectedFixture) return;

        const uiState = readLightingValuesFromUI();

        updateFixtureState(
            selectedFixture,
            uiState
        );

        scheduleSendCurrentFixtureState();
    });

    lightingController = {
        selectFixtureById,
        getSelectedFixture: () => selectedFixture,
        getSelectedFixtureType: () => selectedFixtureType
    };

    renderAll();
    sendCurrentFixtureState();
}

export function selectLightingFixtureById(lightId) {
    if (!lightingController) {
        console.warn('[LightingControl] controller is not ready yet');
        return;
    }

    lightingController.selectFixtureById(lightId);
}

export function getSelectedLightingFixture() {
    return lightingController?.getSelectedFixture() || null;
}

export function getSelectedLightingFixtureType() {
    return lightingController?.getSelectedFixtureType() || null;
}