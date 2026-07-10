import {
    FIXTURE_TYPES,
    getFixturesByType
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

        updatePanelVisibility(selectedFixtureType);

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
    }

    function handleSelectFixture(fixture) {
        selectedFixture = fixture;
        renderAll();
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

    setupLightingInputListeners(() => {
        if (!selectedFixture) return;

        const uiState = readLightingValuesFromUI();

        updateFixtureState(
            selectedFixture,
            uiState
        );

        scheduleSendCurrentFixtureState();
    });

    renderAll();
}