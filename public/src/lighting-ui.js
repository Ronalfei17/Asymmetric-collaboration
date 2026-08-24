import {
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel
} from './lighting-fixture.js';

import {
    getElement
} from './lighting-ui-shared.js';

import {
    readDetailLightingValuesFromUI,
    renderDetailLightingPanel,
    setupDetailLightingListeners
} from './lighting-ui-detail.js';

import {
    readQuickLightingValuesFromUI,
    writeQuickLightingValuesToUI,
    setPowerState,
    updateQuickAngleOptionActive,
    updatePanTiltUI,
    updateFieldAngleUI,
    setupQuickLightingListeners
} from './lighting-ui-quick.js';

export {
    updatePanelVisibility,
    applyFixturePresetToUI,
    setPowerState
} from './lighting-ui-quick.js';

function capsuleClass(isActive) {
    return [
        'h-6 px-3 rounded-full text-[11px] font-semibold transition whitespace-nowrap leading-none',
        isActive
            ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.35)]'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
    ].join(' ');
}

export function renderFixtureTypeCapsules({
    selectedFixtureType,
    onSelectType
}) {
    const container = getElement('fixtureTypeCapsules');
    if (!container) return;

    container.innerHTML = '';

    getFixtureTypes().forEach(type => {
        const button = document.createElement('button');

        button.type = 'button';
        button.innerText = getFixtureTypeLabel(type);
        button.className = capsuleClass(type === selectedFixtureType);

        button.addEventListener('click', () => {
            onSelectType(type);
        });

        container.appendChild(button);
    });
}
    // Fixture ID dropdown.
export function renderFixtureIdDropdown({
    selectedFixtureType,
    selectedFixture,
    onSelectFixture
}) {
    const select = getElement('fixtureIdSelect');
    if (!select) return;

    const fixtures = getFixturesByType(selectedFixtureType);

    select.innerHTML = '';
    select.disabled = fixtures.length === 0;

    fixtures.forEach(fixture => {
        const option = document.createElement('option');

        option.value = String(fixture.lightId);
        option.innerText = `${fixture.displayId || `CH ${fixture.lightId}`} — ${fixture.modelLabel || fixture.label}`;
        option.selected = selectedFixture && Number(fixture.lightId) === Number(selectedFixture.lightId);

        select.appendChild(option);
    });

    select.onchange = () => {
        const nextFixture = fixtures.find(
            fixture =>
                Number(fixture.lightId) ===
                Number(select.value)
        );
        
        if (nextFixture) {
            onSelectFixture(nextFixture);
        }
    };
}

export function updateSelectedInfoPanel(fixture) {
    if (!fixture) return;

    const displayId = fixture.displayId || `CH ${fixture.lightId}`;
    const fixtureName = fixture.label || fixture.name || '--';
    const fixtureType = fixture.fixtureTypeLabel || fixture.fixtureType || '--';
    const fixtureModel = fixture.modelLabel || fixture.fixtureModel || '--';
    const selectedId = getElement('selectedId');
    const selectedName = getElement('selectedName');
    const selectedType = getElement('selectedType');
    const selectedModel = getElement('selectedModel');

    if (selectedId) selectedId.textContent = displayId;
    if (selectedName) selectedName.textContent = fixtureName;
    if (selectedType) selectedType.textContent = fixtureType;
    if (selectedModel) selectedModel.textContent = fixtureModel;

    const detailSelectedFixtureId = getElement('detailSelectedFixtureId');
    const detailSelectedId = getElement('detailSelectedId');
    const detailSelectedName = getElement('detailSelectedName');
    const detailSelectedType = getElement('detailSelectedType');

    if (detailSelectedFixtureId) {
        detailSelectedFixtureId.textContent = displayId;
    }

    if (detailSelectedId) {
        detailSelectedId.textContent = displayId;
    }

    if (detailSelectedName) {
        detailSelectedName.textContent = fixtureName;
    }

    if (detailSelectedType) {
        detailSelectedType.textContent = fixtureType;
    }

    const detailHeaderFixtureType = getElement('detailHeaderFixtureType');
    const detailHeaderFixtureName = getElement('detailHeaderFixtureName');
    const detailHeaderFixtureModel = getElement('detailHeaderFixtureModel');

    if (detailHeaderFixtureType) {
        detailHeaderFixtureType.textContent =
            fixtureType;
    }

    if (detailHeaderFixtureName) {
        detailHeaderFixtureName.textContent =
            fixtureName;

        detailHeaderFixtureName.title =
            fixtureName;
    }

    if (detailHeaderFixtureModel) {
        detailHeaderFixtureModel.textContent =
            fixtureModel;

        detailHeaderFixtureModel.title =
            fixtureModel;
    }
}

export function readLightingValuesFromUI(
    fixture
) {
    const detailPage =
        getElement('page-light');

    const isDetailPageActive =
        Boolean(detailPage) &&
        !detailPage.classList.contains(
            'hidden'
        );

    const quickState =
        readQuickLightingValuesFromUI(
            fixture
        );

    const detailState =
        isDetailPageActive
            ? readDetailLightingValuesFromUI(
                fixture
            )
            : {};

    return {
        ...quickState,
        ...detailState
    };
}

export function writeLightingValuesToUI(
    state,
    fixture
) {
    if (!state) {
        return;
    }

    writeQuickLightingValuesToUI(
        state,
        fixture
    );

    renderDetailLightingPanel(
        fixture,
        state
    );
}

export function setupLightingInputListeners(
    onInput
) {
    setupQuickLightingListeners(
        onInput
    );

    setupDetailLightingListeners({
        onInput,
        setPowerState,
        updateQuickAngleOptionActive,
        updateFieldAngleUI,
        updatePanTiltUI
    });
}
