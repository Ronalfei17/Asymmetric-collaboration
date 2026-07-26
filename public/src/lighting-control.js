import {
    FIXTURE_TYPES,
    FIXTURES,
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

    function renderActiveLightTags(){
        const tagContainer = document.getElementById('activeLightTags');
        const countElement = document.getElementById('activeLightCount');

        if (!tagContainer) return;

        const activeFixtures = FIXTURES.filter(fixture => {const state = getFixtureState(fixture);
            if (!state) return false;
            return state.isOn ===true;
        });

        tagContainer.innerHTML = '';
        if (countElement) {countElement.textContent = String(activeFixtures.length);}
        if (activeFixtures.length === 0) {const emptyLabel = document.createElement('span');
            emptyLabel.className = ['text-[11px]', '[text-gray-500]'].join('');
            emptyLabel.textContent = 'No active lights';
            agContainer.appendChild(emptyLabel);
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
            return;
        }
        applyFixturePresetToUI(selectedFixture);

        const fixtureState = getFixtureState(selectedFixture);
        writeLightingValuesToUI(fixtureState, selectedFixture);

        updateSelectedInfoPanel(selectedFixture);
        renderActiveLightTags();
    }

    function handleSelectType(nextType) {
        const firstFixtureOfType = getFixturesByType(nextType)[0] || null;

        if (!firstFixtureOfType) {
            selectedFixtureType = nextType;
            selectedFixture = null;
            renderAll();
            return;
        }

        selectFixture(firstFixtureOfType, {
            emit: true,
            source: 'lighting-control',
            send: true
        });
    }

    function handleSelectFixture(fixture) {
        selectFixture(fixture, {
            emit: true,
            source: 'lighting-control',
            send: true
        });
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
        if (source === 'lighting-control') return;

        selectFixtureById(lightId, {
            emit: false,
            source,
            send: true
        });
    });

    setupLightingInputListeners((options = {}) => {
        if (!selectedFixture) return;

        const uiState = readLightingValuesFromUI();

        updateFixtureState(
            selectedFixture,
            uiState
        );

        if (options.render) {
            renderAll();
        } else {renderActiveLightTags();}

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