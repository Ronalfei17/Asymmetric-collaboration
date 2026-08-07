import {
    FIXTURE_TYPES,
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel
} from './lighting-fixture.js';

import {
    getElement,
    toBoolean,
    getFixturePreset,
    getAngleConfig,
    sanitizeAngleForFixture,
    formatPanTilt
} from './lighting-ui-shared.js';

import {
    readDetailLightingValuesFromUI,
    renderDetailLightingPanel,
    setupDetailLightingListeners
} from './lighting-ui-detail.js';

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
// [新增] Fixture ID 下拉列表
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
        option.selected = selectedFixture && fixture.lightId === selectedFixture.lightId;

        select.appendChild(option);
    });

    select.onchange = () => {
        const nextFixture = fixtures.find(
            fixture => fixture.lightId === Number(select.value)
        );

        if (nextFixture) {
            onSelectFixture(nextFixture);
        }
    };
}

export function updatePanelVisibility(fixtureType, fixture) {
    const quickAimTitle = getElement('quickAimTitle');
    const quickAimTag = getElement('quickAimTag');
    const quickAngleTitle = getElement('quickAngleTitle');
    const quickAngleLabel = getElement('quickAngleLabel');

    const isMoving = fixtureType === FIXTURE_TYPES.MOVING;
    const isFresnel = fixtureType === FIXTURE_TYPES.FRESNEL;

    if (quickAimTitle) {
        quickAimTitle.textContent = isMoving ? 'SPATIAL MOVEMENT' : 'AIM';
    }

    quickAimTag?.classList.toggle('hidden', isMoving);

    if (quickAngleTitle) {
        quickAngleTitle.textContent = isMoving || isFresnel ? 'BEAM ANGLE' : 'FIELD ANGLE';
    }

    if (quickAngleLabel) {
        quickAngleLabel.textContent = isMoving || isFresnel ? 'Beam Angle' : 'Angle';
    }

}

export function applyFixturePresetToUI(fixture) {
    if (!fixture) return;

    const preset = getFixturePreset(fixture);

    applyQuickAnglePreset(fixture, preset);
    applyQuickAimPreset(fixture, preset);
}

function updateQuickAngleOptionActive(angle) {
    document.querySelectorAll('.quick-angle-option').forEach(option => {
        const isActive = Math.abs(Number(option.dataset.angle) - Number(angle)) < 0.01;
        const dot = option.querySelector('.quick-angle-dot');

        option.classList.toggle('border-blue-500', isActive);
        option.classList.toggle('bg-blue-500/20', isActive);
        option.classList.toggle('text-blue-100', isActive);

        option.classList.toggle('border-gray-700', !isActive);
        option.classList.toggle('bg-white/5', !isActive);
        option.classList.toggle('text-gray-300', !isActive);

        if (dot) {
            dot.classList.toggle('border-blue-400', isActive);
            dot.classList.toggle('after:block', isActive);

            dot.classList.toggle('border-gray-500', !isActive);
            dot.classList.toggle('after:hidden', !isActive);
        }
    });
}

function getCurrentAngleFromUI(fixture) {
    const { angleOptions, defaultAngle, hasOptions, isFixed } = getAngleConfig(fixture);
    const slider = getElement('fieldAngleSlider');

    if (isFixed) return defaultAngle;

    const value = Number(slider?.value);

    if (hasOptions) {
        const isValidOption = angleOptions.some(angle =>
            Math.abs(Number(angle) - value) < 0.01
        );

        return isValidOption ? value : defaultAngle;
    }

    return Number.isFinite(value) ? value : defaultAngle;
}

function applyQuickAnglePreset(fixture, preset) {
    const sliderWrap = getElement('quickAngleSliderWrap');
    const fixedWrap = getElement('quickAngleFixedWrap');
    const fixedValue = getElement('quickAngleFixedValue');
    const optionsWrap = getElement('quickAngleOptionsWrap');
    const slider = getElement('fieldAngleSlider');
    const value = getElement('fieldAngleValue');

    const minLabel = getElement('fieldAngleMinLabel');
    const maxLabel = getElement('fieldAngleMaxLabel');

    if (!preset) return;

    const {
        angleOptions,
        angleMin,
        angleMax,
        defaultAngle,
        hasOptions,
        isFixed
    } = getAngleConfig(fixture);

    sliderWrap?.classList.toggle('hidden', hasOptions || isFixed);
    fixedWrap?.classList.toggle('hidden', !isFixed);
    fixedWrap?.classList.toggle('flex', isFixed);
    optionsWrap?.classList.toggle('hidden', !hasOptions);
    optionsWrap?.classList.toggle('flex', hasOptions);

    value?.classList.toggle('hidden', hasOptions || isFixed);

    if (hasOptions) {
        const selectedAngle = angleOptions.some(angle =>
            Math.abs(Number(angle) - Number(defaultAngle)) < 0.01
        )
            ? Number(defaultAngle)
            : Number(angleOptions[0]);

        if (slider) {
            slider.value = selectedAngle;
        }

        updateQuickAngleOptionActive(selectedAngle);
        updateFieldAngleUI();
        return;
    }

    if (isFixed) {
        const fixedAngle = Number(defaultAngle);

        if (slider) {
            slider.value = fixedAngle;
        }

        if (fixedValue) {
            fixedValue.innerHTML = `${fixedAngle}&deg;`;
        }

        updateFieldAngleUI();
        return;
    }

    if (slider) {
        slider.min = angleMin ?? 10;
        slider.max = angleMax ?? 60;
        slider.step = 0.1;
        slider.value = defaultAngle;
    }

    if (minLabel) minLabel.innerHTML = `${angleMin ?? 10}&deg;`;
    if (maxLabel) maxLabel.innerHTML = `${angleMax ?? 60}&deg;`;

    updateFieldAngleUI();
}

function applyQuickAimPreset(fixture, preset) {
    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    const panMinLabel = getElement('panMinLabel');
    const panMaxLabel = getElement('panMaxLabel');
    const tiltMinLabel = getElement('tiltMinLabel');
    const tiltMaxLabel = getElement('tiltMaxLabel');

    const isMoving = fixture.fixtureType === FIXTURE_TYPES.MOVING;

    const panMin = isMoving ? preset?.panMin : preset?.aimPanMin ?? -180;
    const panMax = isMoving ? preset?.panMax : preset?.aimPanMax ?? 180;
    const tiltMin = isMoving ? preset?.tiltMin : preset?.aimTiltMin ?? -90;
    const tiltMax = isMoving ? preset?.tiltMax : preset?.aimTiltMax ?? 90;

    if (panSlider) {
        panSlider.min = panMin;
        panSlider.max = panMax;
    }

    if (tiltSlider) {
        tiltSlider.min = tiltMin;
        tiltSlider.max = tiltMax;
    }

    if (panMinLabel) panMinLabel.innerHTML = `${panMin}&deg;`;
    if (panMaxLabel) panMaxLabel.innerHTML = `${panMax}&deg;`;
    if (tiltMinLabel) tiltMinLabel.innerHTML = `${tiltMin}&deg;`;
    if (tiltMaxLabel) tiltMaxLabel.innerHTML = `${tiltMax}&deg;`;
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

export function setPowerState(isOn) {
    isOn = toBoolean(isOn, true);
    const powerToggle = getElement('powerToggle');
    const powerKnob = getElement('powerKnob');
    const powerLamp = getElement('powerLamp');
    const powerStatusLabel = getElement('powerStatusLabel');

    if (!powerToggle) return;

    powerToggle.dataset.on = String(isOn);

    if (isOn) {
        powerToggle.className = 'w-14 h-8 rounded-full bg-green-500 relative shadow-[0_0_14px_rgba(34,197,94,0.35)] transition-all';

        if (powerKnob) {
            powerKnob.className = 'absolute right-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-all';
        }

        if (powerLamp) {
            powerLamp.className = 'w-12 h-12 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center text-green-300 transition-all shadow-[0_0_18px_rgba(34,197,94,0.2)]';
        }

        if (powerStatusLabel) {
            powerStatusLabel.textContent = 'Lamp On';
            powerStatusLabel.className = 'text-[11px] text-green-400';
        }
    } else {
        powerToggle.className = 'w-14 h-8 rounded-full bg-gray-700 relative shadow-none transition-all';

        if (powerKnob) {
            powerKnob.className = 'absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-all';
        }

        if (powerLamp) {
            powerLamp.className = 'w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-gray-500 transition-all';
        }

        if (powerStatusLabel) {
            powerStatusLabel.textContent = 'Lamp Off';
            powerStatusLabel.className = 'text-[11px] text-gray-500';
        }
    }
}

function updateIntensityUI() {
    const intensitySlider = getElement('intensitySlider');
    const intensityValue = getElement('intensityValue');

    if (intensitySlider && intensityValue) {
        intensityValue.innerText = `${intensitySlider.value}%`;
    }
}

function updatePanTiltUI() {
    const panSlider =
        getElement('panSlider');

    const tiltSlider =
        getElement('tiltSlider');

    const panValue =
        getElement('panValue');

    const tiltValue =
        getElement('tiltValue');

    if (panSlider && panValue) {
        panValue.innerHTML =
            `${formatPanTilt(
                panSlider.value
            )}&deg;`;
    }

    if (tiltSlider && tiltValue) {
        tiltValue.innerHTML =
            `${formatPanTilt(
                tiltSlider.value
            )}&deg;`;
    }
}

function updateFieldAngleUI() {
    const slider = getElement('fieldAngleSlider');
    const value = getElement('fieldAngleValue');

    if (slider && value) {
        value.innerText = `${slider.value}°`;
    }
}

export function readLightingValuesFromUI(fixture) {
    const powerToggle = getElement('powerToggle');
    const intensitySlider = getElement('intensitySlider');
    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    const detailPage = getElement('page-light');

    const isDetailPageActive =
        Boolean(detailPage) &&
        !detailPage.classList.contains('hidden');

    const quickState = {
        isOn: powerToggle
            ? toBoolean(powerToggle.dataset.on, true)
            : true,

        intensity: intensitySlider
            ? Number(intensitySlider.value) / 100
            : 0,

        fieldAngle: getCurrentAngleFromUI(fixture),

        pan: panSlider
            ? Number(panSlider.value)
            : 0,

        tilt: tiltSlider
            ? Number(tiltSlider.value)
            : 0
    };

    const detailState = isDetailPageActive
        ? readDetailLightingValuesFromUI(fixture)
        : {};

    return {
        ...quickState,
        ...detailState
    };
}

export function writeLightingValuesToUI(state, fixture) {
    if (!state) return;

    setPowerState(toBoolean(state.isOn, true));

    const intensitySlider = getElement('intensitySlider');

    if (
        intensitySlider &&
        state.intensity !== undefined
    ) {
        intensitySlider.value =
            Math.round(Number(state.intensity) * 100);
    }

    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    if (panSlider && state.pan !== undefined) {
        panSlider.value = state.pan;
    }

    if (tiltSlider && state.tilt !== undefined) {
        tiltSlider.value = state.tilt;
    }

    const cleanFieldAngle =
        sanitizeAngleForFixture(
            fixture,
            state.fieldAngle
        );

    const fieldAngleSlider =
        getElement('fieldAngleSlider');

    if (fieldAngleSlider) {
        fieldAngleSlider.value = cleanFieldAngle;
    }

    updateQuickAngleOptionActive(cleanFieldAngle);
    updateIntensityUI();
    updatePanTiltUI();
    updateFieldAngleUI();

    renderDetailLightingPanel(fixture, state);
}

export function setupLightingInputListeners(onInput) {
    const powerToggle = getElement('powerToggle');

    if (powerToggle) {
        powerToggle.addEventListener('click', () => {
            const currentState = toBoolean(powerToggle.dataset.on, true);
            const nextState = !currentState;

            setPowerState(nextState);
            onInput();
        });
    }

    const intensitySlider = getElement('intensitySlider');

    if (intensitySlider) {
        intensitySlider.addEventListener('input', () => {
            updateIntensityUI();
            onInput();
        });
    }

    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    if (panSlider) {
        panSlider.addEventListener('input', () => {
            updatePanTiltUI();
            onInput();
        });
    }

    if (tiltSlider) {
        tiltSlider.addEventListener('input', () => {
            updatePanTiltUI();
            onInput();
        });
    }

    const resetAnglesBtn = getElement('resetAnglesBtn');

    if (resetAnglesBtn && panSlider && tiltSlider) {
        resetAnglesBtn.addEventListener('click', () => {
            panSlider.value = 0;
            tiltSlider.value = 0;
            updatePanTiltUI();
            onInput();
        });
    }

    const fieldAngleSlider = getElement('fieldAngleSlider');

    fieldAngleSlider?.addEventListener('input', () => {
        updateFieldAngleUI();
        onInput();
    });

    document.querySelectorAll('.quick-angle-option').forEach(button => {
        button.addEventListener('click', () => {
            const angle = Number(button.dataset.angle);
            const fieldAngleSlider = getElement('fieldAngleSlider');

            if (fieldAngleSlider) {
                fieldAngleSlider.value = angle;
            }

            updateQuickAngleOptionActive(angle);
            updateFieldAngleUI();
            onInput();
        });
    });

    setupDetailLightingListeners({
        onInput,
        setPowerState,
        updateQuickAngleOptionActive,
        updateFieldAngleUI,
        updatePanTiltUI
    });

    updateIntensityUI();
    updatePanTiltUI();
    updateFieldAngleUI();
}