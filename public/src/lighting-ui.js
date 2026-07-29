import {
    FIXTURE_TYPES,
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel,
    getProfileModelPreset,
    getLedModelPreset,
    getFresnelModelPreset,
    getMovingModelPreset
} from './lighting-fixture.js';

import {
    clamp,
    rgbToHex,
    rgbToHsv,
    hsvToRgb
} from './lighting-color-utils.js';

function getElement(id) {
    return document.getElementById(id);
}

function toBoolean(value, fallback = true) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return fallback;
}

function isAdvancedLedFixture(fixture) {
    const preset = getLedModelPreset(fixture?.fixtureModel);

    return fixture?.fixtureType === FIXTURE_TYPES.LED &&
           Boolean(preset?.supportsAdvancedModes);
}

function getFixturePreset(fixture) {
    if (!fixture) return null;

    if (fixture.fixtureType === FIXTURE_TYPES.PROFILE) {
        return getProfileModelPreset(fixture.fixtureModel);
    }

    if (fixture.fixtureType === FIXTURE_TYPES.LED) {
        return getLedModelPreset(fixture.fixtureModel);
    }

    if (fixture.fixtureType === FIXTURE_TYPES.FRESNEL) {
        return getFresnelModelPreset(fixture.fixtureModel);
    }

    if (fixture.fixtureType === FIXTURE_TYPES.MOVING) {
        return getMovingModelPreset(fixture.fixtureModel);
    }

    return null;
}

function createDefaultSegments(count = 8) {
    return Array.from({ length: count }, () => ({
        r: 255,
        g: 128,
        b: 64
    }));
}

let currentLedState = {
    ledMode: 'solid',
    segmentMode: 8,
    selectedSegment: 0,
    segments: createDefaultSegments(8),
    chaseSpeed: 1.5,
    direction: 'forward',
    repeatMode: 'single',
    strobeHz: 0
};

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

function getAngleConfig(fixture) {
    const preset = getFixturePreset(fixture) || {};

    const angleOptions = preset.fieldAngleOptions ?? preset.beamAngleOptions;
    const angleMin = preset.fieldAngleMin ?? preset.beamAngleMin;
    const angleMax = preset.fieldAngleMax ?? preset.beamAngleMax;

    const defaultAngle = Number(
        preset.defaultFieldAngle ??
        preset.defaultBeamAngle ??
        angleOptions?.[0] ??
        angleMin ??
        fixture?.defaultState?.fieldAngle ??
        30
    );

    const hasOptions = Array.isArray(angleOptions) && angleOptions.length > 0;
    const isFixed =
        Boolean(preset.fieldAngleFixed) ||
        (!hasOptions &&
            angleMin !== undefined &&
            angleMax !== undefined &&
            Number(angleMin) === Number(angleMax));

    return {
        preset,
        angleOptions,
        angleMin,
        angleMax,
        defaultAngle,
        hasOptions,
        isFixed
    };
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

function formatAngle(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';

    return Number.isInteger(number)
        ? String(number)
        : number.toFixed(1);
}

function sanitizeAngleForFixture(fixture, rawAngle) {
    const {
        angleOptions,
        angleMin,
        angleMax,
        defaultAngle,
        hasOptions,
        isFixed
    } = getAngleConfig(fixture);

    if (isFixed) {
        return defaultAngle;
    }

    const value = Number(rawAngle);

    if (hasOptions) {
        const matchedAngle = angleOptions.find(angle =>
            Math.abs(Number(angle) - value) < 0.01
        );

        return matchedAngle !== undefined
            ? Number(matchedAngle)
            : defaultAngle;
    }

    if (!Number.isFinite(value)) {
        return defaultAngle;
    }

    if (angleMin !== undefined && value < Number(angleMin)) {
        return Number(angleMin);
    }

    if (angleMax !== undefined && value > Number(angleMax)) {
        return Number(angleMax);
    }

    return value;
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

    const selectedId = getElement('selectedId');
    const selectedName = getElement('selectedName');
    const selectedType = getElement('selectedType');
    const selectedModel = getElement('selectedModel');

    if (selectedId) selectedId.innerText = fixture.displayId || `CH ${fixture.lightId}`;
    if (selectedName) selectedName.innerText = fixture.label || '--';
    if (selectedType) selectedType.innerText = fixture.fixtureTypeLabel || fixture.fixtureType || '--';
    if (selectedModel) selectedModel.innerText = fixture.modelLabel || fixture.fixtureModel || '--';

    const detailSelectedFixtureId = getElement('detailSelectedFixtureId');
    const detailSelectedId = getElement('detailSelectedId');
    const detailSelectedName = getElement('detailSelectedName');
    const detailSelectedType = getElement('detailSelectedType');
    const detailFixtureModeLabel = getElement('detailFixtureModeLabel');

    if (detailSelectedFixtureId) {
        detailSelectedFixtureId.innerText = fixture.displayId || `CH ${fixture.lightId}`;
    }

    if (detailSelectedId) {
        detailSelectedId.innerText = fixture.displayId || `CH ${fixture.lightId}`;
    }

    if (detailSelectedName) {
        detailSelectedName.innerText = fixture.label || '--';
    }

    if (detailSelectedType) {
        detailSelectedType.innerText = fixture.fixtureTypeLabel || fixture.fixtureType || '--';
    }

    if (detailFixtureModeLabel) {
        detailFixtureModeLabel.innerText = fixture.modelLabel || fixture.fixtureModel || 'Selected fixture';
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

function updateDetailRGBUI() {
    const r = Number(
        getElement('detailRedSlider')?.value ?? 255
    );

    const g = Number(
        getElement('detailGreenSlider')?.value ?? 128
    );

    const b = Number(
        getElement('detailBlueSlider')?.value ?? 64
    );

    const hex = rgbToHex(r, g, b);

    const rValue = getElement('detailRedValue');
    const gValue = getElement('detailGreenValue');
    const bValue = getElement('detailBlueValue');
    const hexValue = getElement('detailHexValue');
    const preview = getElement('detailColorPreview');

    if (rValue) rValue.textContent = String(r);
    if (gValue) gValue.textContent = String(g);
    if (bValue) bValue.textContent = String(b);
    if (hexValue) hexValue.textContent = hex;

    if (preview) {
        preview.style.background = hex;
    }

    updateDetailRgbWheelHandle(r, g, b);
}

function updateIntensityUI() {
    const intensitySlider = getElement('intensitySlider');
    const intensityValue = getElement('intensityValue');

    if (intensitySlider && intensityValue) {
        intensityValue.innerText = `${intensitySlider.value}%`;
    }
}

function updatePanTiltUI() {
    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');
    const panValue = getElement('panValue');
    const tiltValue = getElement('tiltValue');

    if (panSlider && panValue) {
        panValue.innerHTML = `${panSlider.value}&deg;`;
    }

    if (tiltSlider && tiltValue) {
        tiltValue.innerHTML = `${tiltSlider.value}&deg;`;
    }
}

function updateFieldAngleUI() {
    const slider = getElement('fieldAngleSlider');
    const value = getElement('fieldAngleValue');

    if (slider && value) {
        value.innerText = `${slider.value}°`;
    }
}

function updateSoftnessUI() {
    const slider = getElement('softnessSlider');
    const value = getElement('softnessValue');

    if (slider && value) {
        value.innerText = `${Math.round(Number(slider.value) * 100)}%`;
    }
}

function updateStrobeUI() {
    const slider = getElement('strobeSlider');
    const value = getElement('strobeValue');

    if (slider && value) {
        value.innerText = `${slider.value} Hz`;
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

function getDetailAngleFromUI(fixture) {
    const { hasOptions, isFixed, defaultAngle } = getAngleConfig(fixture);

    if (isFixed) {
        return defaultAngle;
    }

    if (hasOptions) {
        const activeOption = Array.from(document.querySelectorAll('.detail-angle-option'))
            .find(option => option.classList.contains('border-blue-500'));

        const angle = Number(activeOption?.dataset.detailAngle);
        return Number.isFinite(angle) ? angle : defaultAngle;
    }

    const slider = getElement('detailFieldAngleSlider');
    return slider ? Number(slider.value) : undefined;
}

function readDetailLightingValuesFromUI(fixture) {
    const detailPowerState = getElement('detailPowerState');
    const detailIntensitySlider = getElement('detailIntensitySlider');
    const detailPanSlider = getElement('detailPanSlider');
    const detailTiltSlider = getElement('detailTiltSlider');

    const detailRedSlider = getElement('detailRedSlider');
    const detailGreenSlider = getElement('detailGreenSlider');
    const detailBlueSlider = getElement('detailBlueSlider');
    const detailStrobeHzSlider = getElement('detailStrobeHzSlider');

    const detailSoftnessSlider = getElement('detailSoftnessSlider');
    const detailColorBlazePanel = getElement('detailColorBlazePanel');

    const state = {};
    const isAdvancedLed = isAdvancedLedFixture(fixture);

    if (detailPowerState) {
        state.isOn = toBoolean(detailPowerState.dataset.on, true);
    }

    if (detailIntensitySlider) {
        state.intensity = Number(detailIntensitySlider.value) / 100;
    }

    const detailAngle = getDetailAngleFromUI(fixture);

    if (detailAngle !== undefined) {
        state.fieldAngle = detailAngle;
    }

    if (detailPanSlider) {
        state.pan = Number(detailPanSlider.value);
    }

    if (detailTiltSlider) {
        state.tilt = Number(detailTiltSlider.value);
    }

    if (detailSoftnessSlider) {
        state.softness = Number(detailSoftnessSlider.value);
    }

    // 普通灯：读取普通 RGB / Strobe
    if (!isAdvancedLed) {
        if (detailRedSlider) state.r = Number(detailRedSlider.value);
        if (detailGreenSlider) state.g = Number(detailGreenSlider.value);
        if (detailBlueSlider) state.b = Number(detailBlueSlider.value);
        if (detailStrobeHzSlider) state.strobeHz = Number(detailStrobeHzSlider.value);
    }

    // ColorBlaze 48：RGB / Strobe / Segment 都从高级模式面板读取
    if (isAdvancedLed && detailColorBlazePanel) {
        state.ledMode =
            detailColorBlazePanel.dataset.ledMode ??
            'solid';

        state.segmentMode = Number(
            detailColorBlazePanel.dataset.ledSegments ??
            8
        );

        state.selectedSegment = Number(
            currentLedState.selectedSegment ?? 0
        );

        state.segments =
            currentLedState.segments.map(
                color => ({ ...color })
            );

        state.chaseSpeed = Number(
            getElement('detailLedChaseSpeedSlider')
                ?.value ??
            currentLedState.chaseSpeed ??
            1.5
        );

        state.direction =
            detailColorBlazePanel.dataset.ledDirection ??
            currentLedState.direction ??
            'forward';

        state.repeatMode =
            detailColorBlazePanel.dataset.ledRepeatMode ??
            currentLedState.repeatMode ??
            'single';

        state.strobeHz = Number(
            getElement('detailLedStrobeHzSlider')
                ?.value ??
            currentLedState.strobeHz ??
            0
        );

        const detailR = getElement('detailRedSlider');
        const detailG = getElement('detailGreenSlider');
        const detailB = getElement('detailBlueSlider');

        if (
            detailR &&
            detailG &&
            detailB
        ) {
            state.r = Number(detailR.value);
            state.g = Number(detailG.value);
            state.b = Number(detailB.value);
        } else {
            const selectedColor =
                currentLedState.segments[
                    state.selectedSegment
                ];

            if (selectedColor) {
                state.r = Number(selectedColor.r);
                state.g = Number(selectedColor.g);
                state.b = Number(selectedColor.b);
            }
        }
    }

    return state;
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

function renderDetailLightingPanel(fixture, state = {}) {
    const panel = getElement('detailLightingPanel');
    if (!panel || !fixture) return;

    const preset = getFixturePreset(fixture);
    const isAdvancedLed = isAdvancedLedFixture(fixture);
    const isMoving = fixture.fixtureType === FIXTURE_TYPES.MOVING;
    const isFresnel = fixture.fixtureType === FIXTURE_TYPES.FRESNEL;

    const angleTitle = isMoving || isFresnel ? 'Beam Angle' : 'Field Angle';
    const r = Number(state.r ?? 255);
    const g = Number(state.g ?? 128);
    const b = Number(state.b ?? 64);
    const hex = rgbToHex(r, g, b);

    const supportsRgb =
        fixture.fixtureType === FIXTURE_TYPES.LED ||
        fixture.fixtureType === FIXTURE_TYPES.MOVING;

    const supportsStrobe =
        preset?.supportsStrobe === true ||
        fixture.fixtureType === FIXTURE_TYPES.MOVING;

    const standardBlocks = isAdvancedLed
        ? []
        : [
            supportsRgb
                ? renderDetailRgbBlock(r, g, b, hex)
                : '',

            supportsStrobe
                ? renderDetailStrobeBlock(state)
                : ''
        ].filter(Boolean);

    const standardColorAndStrobe =
        standardBlocks.length === 0
            ? ''
            : `
                <div class="grid ${
                    standardBlocks.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                } gap-3">
                    ${standardBlocks.join('')}
                </div>
            `;

    const colorBlazeAdvanced = isAdvancedLed
        ? renderDetailColorBlazeBlock(state)
        : '';
        
    panel.innerHTML = `
        <div class="space-y-3" data-detail-fixture-id="${fixture.lightId}">
            <div class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <div class="text-blue-400 text-xs font-bold">${fixture.fixtureTypeLabel}</div>
                        <div class="text-gray-100 text-sm font-semibold mt-1">${fixture.label}</div>
                        <div class="text-gray-500 text-xs mt-1">${fixture.modelLabel || ''}</div>
                    </div>
                    <div class="text-xs text-gray-400">${fixture.displayId || `CH ${fixture.lightId}`}</div>
                </div>
            </div>

            
            <div class="grid grid-cols-2 gap-3">
                ${renderDetailPowerBlock(state)}
                ${renderDetailIntensityBlock(state)}
            </div>
            
           ${standardColorAndStrobe}

            <div class="grid grid-cols-2 gap-3">
                ${renderDetailAngleBlock(fixture, preset, state, angleTitle)}
                ${renderDetailAimBlock(fixture, preset, state)}
            </div>

            ${fixture.fixtureType === FIXTURE_TYPES.FRESNEL ? renderDetailFresnelBlock(state) : ''}
            ${fixture.fixtureType === FIXTURE_TYPES.MOVING ? renderDetailMovingBlock(fixture, preset, state) : ''}
            ${colorBlazeAdvanced}
        </div>
    `;

    bindDetailRgbColorWheel();
    const renderedR = Number(
        getElement('detailRedSlider')?.value ?? r
    );

    const renderedG = Number(
        getElement('detailGreenSlider')?.value ?? g
    );

    const renderedB = Number(
        getElement('detailBlueSlider')?.value ?? b
    );

    updateDetailRgbWheelHandle(
        renderedR,
        renderedG,
        renderedB
    );
}

function detailPowerButtonClass(isActive) {
    return [
        'h-10 rounded-md border text-xs font-semibold transition',
        isActive
            ? 'bg-blue-500/70 border-blue-400 text-white'
            : 'bg-white/5 border-gray-700 text-gray-300 hover:bg-white/10'
    ].join(' ');
}

function renderDetailPowerBlock(state) {
    const isOn = toBoolean(state.isOn, true);

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-blue-400 text-xs font-bold mb-3">POWER</div>
            <div id="detailPowerState" data-on="${isOn}" class="grid grid-cols-2 gap-2">
                <button type="button" data-detail-power="true" class="${detailPowerButtonClass(isOn)}">ON</button>
                <button type="button" data-detail-power="false" class="${detailPowerButtonClass(!isOn)}">OFF</button>
            </div>
        </section>
    `;
}

function renderDetailIntensityBlock(state) {
    const value = Math.round(Number(state.intensity ?? 0.78) * 100);

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-orange-400 text-xs font-bold mb-3">INTENSITY</div>
            <input id="detailIntensitySlider" type="range" min="0" max="100" value="${value}" class="w-full accent-blue-500">
            <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
            </div>
            <div id="detailIntensityValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${value}%</div>
        </section>
    `;
}

function updateDetailPowerState(isOn) {
    const powerState = getElement('detailPowerState');
    if (!powerState) return;

    powerState.dataset.on = String(isOn);

    powerState.querySelectorAll('[data-detail-power]').forEach(button => {
        const isActive = toBoolean(button.dataset.detailPower, false) === isOn;
        button.className = detailPowerButtonClass(isActive);
    });
}

function renderDetailRgbBlock(r, g, b, hex) {
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-red-400 text-xs font-bold mb-3">RGB COLOR</div>

            <div class="grid grid-cols-[1fr_170px] gap-4 items-center">
                <div class="space-y-3">
                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-red-400">R</span>
                        <input id="detailRedSlider" type="range" min="0" max="255" value="${r}" class="accent-red-500">
                        <span id="detailRedValue" class="text-center rounded border border-gray-700 bg-white/5 py-1">${r}</span>
                    </label>

                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-green-400">G</span>
                        <input id="detailGreenSlider" type="range" min="0" max="255" value="${g}" class="accent-green-500">
                        <span id="detailGreenValue" class="text-center rounded border border-gray-700 bg-white/5 py-1">${g}</span>
                    </label>

                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-blue-400">B</span>
                        <input id="detailBlueSlider" type="range" min="0" max="255" value="${b}" class="accent-blue-500">
                        <span id="detailBlueValue" class="text-center rounded border border-gray-700 bg-white/5 py-1">${b}</span>
                    </label>

                    <div id="detailHexValue" class="w-28 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${hex}</div>
                </div>

                <div class="flex items-center justify-center gap-3">
                    <div
                        id="detailColorPreview"
                        class="w-16 h-16 rounded-lg border border-white/10 shadow-lg shrink-0"
                        style="background:${hex}"
                    ></div>

                    <div
                        id="detailRgbColorWheel"
                        class="relative h-24 w-24 shrink-0 rounded-full cursor-crosshair"
                        style="background: conic-gradient(red, yellow, lime, cyan, blue, magenta, red);"
                    >
                        <div class="absolute inset-[28%] rounded-full bg-[#0b0f16]"></div>
                        <div
                            id="detailRgbColorWheelHandle"
                            class="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow pointer-events-none"
                        ></div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

let isDraggingDetailRgbWheel = false;

function setDetailRgbValues(r, g, b) {
    r = Math.round(clamp(r, 0, 255));
    g = Math.round(clamp(g, 0, 255));
    b = Math.round(clamp(b, 0, 255));

    const hex = rgbToHex(r, g, b);

    const redSlider = getElement('detailRedSlider');
    const greenSlider = getElement('detailGreenSlider');
    const blueSlider = getElement('detailBlueSlider');

    if (redSlider) redSlider.value = r;
    if (greenSlider) greenSlider.value = g;
    if (blueSlider) blueSlider.value = b;

    getElement('detailRedValue') && (getElement('detailRedValue').textContent = r);
    getElement('detailGreenValue') && (getElement('detailGreenValue').textContent = g);
    getElement('detailBlueValue') && (getElement('detailBlueValue').textContent = b);

    const hexElement = getElement('detailHexValue');
    if (hexElement) {
        if ('value' in hexElement) hexElement.value = hex;
        else hexElement.textContent = hex;
    }

    const preview = getElement('detailColorPreview');
    if (preview) preview.style.background = hex;

    updateDetailRgbWheelHandle(r, g, b);

    redSlider?.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateDetailRgbWheelHandle(r, g, b) {
    const wheel = getElement('detailRgbColorWheel');
    const handle = getElement('detailRgbColorWheelHandle');
    if (!wheel || !handle) return;

    const { h, s } = rgbToHsv(r, g, b);
    const size = wheel.clientWidth || 96;
    const center = size / 2;
    const radius = center * clamp(s, 0, 1);
    const angle = (h - 90) * Math.PI / 180;

    handle.style.left = `${center + Math.cos(angle) * radius}px`;
    handle.style.top = `${center + Math.sin(angle) * radius}px`;
}

function updateDetailRgbFromWheel(event) {
    const wheel = getElement('detailRgbColorWheel');
    if (!wheel) return;

    const rect = wheel.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = event.clientX - rect.left - cx;
    const dy = event.clientY - rect.top - cy;

    const distance = Math.min(Math.hypot(dx, dy), Math.min(cx, cy));
    const h = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    const s = clamp(distance / Math.min(cx, cy), 0, 1);

    const current = rgbToHsv(
        Number(getElement('detailRedSlider')?.value ?? 255),
        Number(getElement('detailGreenSlider')?.value ?? 128),
        Number(getElement('detailBlueSlider')?.value ?? 64)
    );

    const next = hsvToRgb(h, s, current.v ?? 1);
    setDetailRgbValues(next.r, next.g, next.b);
}

function bindDetailRgbColorWheel() {
    const wheel = getElement('detailRgbColorWheel');
    if (!wheel || wheel.dataset.bound === 'true') return;

    wheel.dataset.bound = 'true';

    wheel.addEventListener('pointerdown', event => {
        isDraggingDetailRgbWheel = true;
        wheel.setPointerCapture(event.pointerId);
        updateDetailRgbFromWheel(event);
    });

    wheel.addEventListener('pointermove', event => {
        if (!isDraggingDetailRgbWheel) return;
        updateDetailRgbFromWheel(event);
    });

    wheel.addEventListener('pointerup', () => {
        isDraggingDetailRgbWheel = false;
    });

    wheel.addEventListener('pointercancel', () => {
        isDraggingDetailRgbWheel = false;
    });
}

function renderDetailStrobeBlock(state) {
    const strobeHz = Number(state.strobeHz ?? 0);

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-cyan-400 text-xs font-bold mb-3">STROBE</div>
            <input id="detailStrobeHzSlider" type="range" min="0" max="20" step="1" value="${strobeHz}" class="w-full accent-cyan-500">
            <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>0 Hz</span>
                <span>20 Hz</span>
            </div>
            <div id="detailStrobeHzValue" class="mx-auto mt-3 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${strobeHz} Hz</div>
        </section>
    `;
}

function renderDetailAngleBlock(fixture, preset, state, title) {
    const angleConfig = getAngleConfig(fixture);
    const { angleOptions, angleMin, angleMax, defaultAngle, hasOptions, isFixed } = angleConfig;

    let value = sanitizeAngleForFixture(fixture, state.fieldAngle ?? defaultAngle);

    if (isFixed) {
        value = defaultAngle;
    }

    if (hasOptions) {
        const isValidOption = angleOptions.some(angle =>
            Math.abs(Number(angle) - value) < 0.01
        );

        if (!isValidOption) {
            value = defaultAngle;
        }
    }

    if (hasOptions) {
        return `
            <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
                <div class="text-blue-400 text-xs font-bold mb-3">${title.toUpperCase()}</div>
                <div class="grid grid-cols-2 gap-2">
                    ${angleOptions.map(angle => {
                        const isActive = Math.abs(Number(angle) - value) < 0.01;

                        return `
                            <button
                                type="button"
                                class="detail-angle-option px-3 py-2 rounded-md border ${isActive ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-gray-700 bg-white/5 text-gray-300'}"
                                data-detail-angle="${angle}"
                            >
                                ${formatAngle(angle)}&deg;
                            </button>
                        `;
                    }).join('')}
                </div>
            </section>
        `;
    }

    const min = angleMin ?? defaultAngle;
    const max = angleMax ?? defaultAngle;

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-blue-400 text-xs font-bold mb-3">${title.toUpperCase()}</div>

            ${isFixed ? `
                <div class="h-24 flex items-center justify-center">
                    <div class="px-6 py-3 rounded-lg border border-gray-700 bg-white/5 text-2xl">${formatAngle(value)}&deg;</div>
                </div>
            ` : `
                <input id="detailFieldAngleSlider" type="range" min="${min}" max="${max}" step="0.1" value="${value}" class="w-full accent-blue-500">
                <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>${formatAngle(min)}&deg;</span>
                    <span>${formatAngle(max)}&deg;</span>
                </div>
                <div id="detailFieldAngleValue" class="mx-auto mt-3 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${formatAngle(value)}&deg;</div>
            `}
        </section>
    `;
}

function renderDetailAimBlock(fixture, preset, state) {
    const isMoving = fixture.fixtureType === FIXTURE_TYPES.MOVING;
    const title = isMoving ? 'SPATIAL MOVEMENT' : 'AIM';
    const panMin = isMoving ? preset?.panMin : preset?.aimPanMin ?? -180;
    const panMax = isMoving ? preset?.panMax : preset?.aimPanMax ?? 180;
    const tiltMin = isMoving ? preset?.tiltMin : preset?.aimTiltMin ?? -90;
    const tiltMax = isMoving ? preset?.tiltMax : preset?.aimTiltMax ?? 90;

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="flex items-center gap-2 mb-3">
                <div class="text-green-400 text-xs font-bold">${title}</div>
                ${isMoving ? '' : '<span class="px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-[9px] text-yellow-300">Preview Only</span>'}
            </div>

            <div class="space-y-4">
                <div>
                    <div class="text-xs text-gray-300 mb-1">Pan</div>
                    <input id="detailPanSlider" type="range" min="${panMin}" max="${panMax}" step="0.5" value="${state.pan ?? 0}" class="w-full accent-blue-500">
                    <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                        <span>${panMin}&deg;</span><span>0&deg;</span><span>${panMax}&deg;</span>
                    </div>
                    <div id="detailPanValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${state.pan ?? 0}&deg;</div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-1">Tilt</div>
                    <input id="detailTiltSlider" type="range" min="${tiltMin}" max="${tiltMax}" step="0.5" value="${state.tilt ?? 0}" class="w-full accent-blue-500">
                    <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                        <span>${tiltMin}&deg;</span><span>0&deg;</span><span>${tiltMax}&deg;</span>
                    </div>
                    <div id="detailTiltValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${state.tilt ?? 0}&deg;</div>
                </div>
            </div>
        </section>
    `;
}

function renderDetailFresnelBlock(state) {
    const softness = clamp(Number(state.softness ?? 0.75), 0, 1);

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-purple-400 text-xs font-bold mb-3">EDGE SOFTNESS</div>

            <div>
                <div class="text-xs text-gray-300 mb-1">Softness</div>
                <input
                    id="detailSoftnessSlider"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value="${softness}"
                    class="w-full accent-purple-500"
                >
                <div id="detailSoftnessValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">
                    ${Math.round(softness * 100)}%
                </div>
            </div>
        </section>
    `;
}

function renderDetailMovingBlock(fixture, preset, state) {
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-green-400 text-xs font-bold mb-2">MOVING LIGHT EXTRA</div>
            <div class="text-xs text-gray-500">
                Moving fixtures use real pan / tilt ranges from fixture preset. Strobe and beam angle are available above.
            </div>
        </section>
    `;
}

function renderDetailColorBlazeBlock(state = {}) {
    const mode = state.ledMode ?? 'solid';
    const segmentMode = Number(state.segmentMode ?? 8);
    const chaseSpeed = Number(state.chaseSpeed ?? 1.5);
    const direction = state.direction ?? 'forward';
    const repeatMode = state.repeatMode ?? 'single';
    const strobeHz = Number(state.strobeHz ?? 0);

    const segments = normalizeLedSegments(
        state.segments,
        segmentMode
    );

    const selectedSegment = Math.max(
        0,
        Math.min(
            Number(state.selectedSegment ?? 0),
            segments.length - 1
        )
    );

    const selectedColor =
        mode === 'solid'
            ? {
                r: Number(
                    state.r ??
                    segments[0]?.r ??
                    255
                ),

                g: Number(
                    state.g ??
                    segments[0]?.g ??
                    128
                ),

                b: Number(
                    state.b ??
                    segments[0]?.b ??
                    64
                )
            }
            : (
                segments[selectedSegment] ?? {
                    r: 255,
                    g: 128,
                    b: 64
                }
            );

    const selectedHex = rgbToHex(
        selectedColor.r,
        selectedColor.g,
        selectedColor.b
    );

    currentLedState = {
        ...currentLedState,
        ledMode: mode,
        segmentMode,
        selectedSegment,
        segments,
        chaseSpeed,
        direction,
        repeatMode,
        strobeHz
    };

    const showRgbEditor =
        mode === 'solid' ||
        mode === 'manual';

    return `
        <section
            id="detailColorBlazePanel"
            class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3"
            data-led-mode="${mode}"
            data-led-segments="${segmentMode}"
            data-led-direction="${direction}"
            data-led-repeat-mode="${repeatMode}"
        >
            <div class="text-red-400 text-xs font-bold mb-3">
                COLORBLAZE 48 MODE
            </div>

            <div class="grid grid-cols-4 gap-1 rounded-lg border border-gray-700 p-1 mb-3">
                ${['solid', 'gradient', 'chase', 'manual']
                    .map(item => `
                        <button
                            type="button"
                            data-detail-led-mode="${item}"
                            class="
                                detail-led-mode-btn
                                h-8
                                rounded-md
                                border
                                text-xs
                                transition
                                ${
                                    mode === item
                                        ? 'bg-blue-500/30 text-blue-200 border-blue-500'
                                        : 'bg-transparent text-gray-300 border-transparent hover:bg-white/5'
                                }
                            "
                        >
                            ${item.toUpperCase()}
                        </button>
                    `)
                    .join('')}
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div class="text-xs text-gray-300 mb-2">
                        Segment Mode
                    </div>

                    <div class="grid grid-cols-2 gap-1 rounded-lg border border-gray-700 p-1">
                        <button
                            type="button"
                            data-detail-led-segments="4"
                            class="
                                detail-led-segment-mode
                                h-8
                                rounded-md
                                border
                                text-xs
                                transition
                                ${
                                    segmentMode === 4
                                        ? 'bg-blue-500/30 text-blue-200 border-blue-500'
                                        : 'text-gray-300 border-transparent hover:bg-white/5'
                                }
                            "
                        >
                            4 Segments
                        </button>

                        <button
                            type="button"
                            data-detail-led-segments="8"
                            class="
                                detail-led-segment-mode
                                h-8
                                rounded-md
                                border
                                text-xs
                                transition
                                ${
                                    segmentMode === 8
                                        ? 'bg-blue-500/30 text-blue-200 border-blue-500'
                                        : 'text-gray-300 border-transparent hover:bg-white/5'
                                }
                            "
                        >
                            8 Segments
                        </button>
                    </div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-2">
                        Chase Speed
                    </div>

                    <input
                        id="detailLedChaseSpeedSlider"
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value="${chaseSpeed}"
                        class="w-full accent-green-500"
                    >

                    <div
                        id="detailLedChaseSpeedValue"
                        class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs"
                    >
                        ${chaseSpeed}x
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div class="text-xs text-gray-300 mb-2">
                        Direction
                    </div>

                    <div class="grid grid-cols-3 gap-1 rounded-lg border border-gray-700 p-1">
                        ${['forward', 'reverse', 'mirror']
                            .map(item => `
                                <button
                                    type="button"
                                    data-detail-led-direction="${item}"
                                    class="
                                        h-8
                                        rounded-md
                                        border
                                        text-[11px]
                                        transition
                                        ${
                                            direction === item
                                                ? 'bg-green-500/20 text-green-300 border-green-500'
                                                : 'text-gray-300 border-transparent hover:bg-white/5'
                                        }
                                    "
                                >
                                    ${item.toUpperCase()}
                                </button>
                            `)
                            .join('')}
                    </div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-2">
                        Repeat Mode
                    </div>

                    <div class="grid grid-cols-3 gap-1 rounded-lg border border-gray-700 p-1">
                        ${['single', 'repeat', 'mirror']
                            .map(item => `
                                <button
                                    type="button"
                                    data-detail-led-repeat-mode="${item}"
                                    class="
                                        h-8
                                        rounded-md
                                        border
                                        text-[11px]
                                        transition
                                        ${
                                            repeatMode === item
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                                                : 'text-gray-300 border-transparent hover:bg-white/5'
                                        }
                                    "
                                >
                                    ${item.toUpperCase()}
                                </button>
                            `)
                            .join('')}
                    </div>
                </div>
            </div>

            <div class="rounded-lg border border-gray-800 bg-black/20 p-3 mb-3">
                <div class="text-xs text-gray-300 mb-2">
                    Strobe
                </div>

                <input
                    id="detailLedStrobeHzSlider"
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value="${strobeHz}"
                    class="w-full accent-cyan-500"
                >

                <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                    <span>0 Hz</span>
                    <span>20 Hz</span>
                </div>

                <div
                    id="detailLedStrobeHzValue"
                    class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs"
                >
                    ${strobeHz} Hz
                </div>
            </div>

            ${
                mode === 'manual'
                    ? renderDetailManualSegmentGrid(segments)
                    : ''
            }

            ${
                showRgbEditor
                    ? `
                        <div class="mt-3">
                            ${renderDetailRgbBlock(
                                selectedColor.r,
                                selectedColor.g,
                                selectedColor.b,
                                selectedHex
                            )}
                        </div>
                    `
                    : ''
            }

            ${
                mode === 'gradient'
                    ? `
                        <div class="text-xs text-gray-400 rounded-lg border border-gray-800 bg-black/20 p-3">
                            Gradient mode requires Color A and Color B controls.
                            These controls have not yet been added.
                        </div>
                    `
                    : ''
            }

            ${
                mode === 'chase'
                    ? `
                        <div class="text-xs text-gray-400 rounded-lg border border-gray-800 bg-black/20 p-3">
                            Chase mode requires two chase colors.
                            The speed, direction and repeat controls are available above.
                        </div>
                    `
                    : ''
            }
        </section>
    `;
}

function normalizeLedSegments(segments, count) {
    const source =
        Array.isArray(segments)
            ? segments
            : [];

    const fallback =
        source[source.length - 1] ?? {
            r: 255,
            g: 128,
            b: 64
        };

    return Array.from(
        { length: count },
        (_, index) => {
            const color =
                source[index] ?? fallback;

            return {
                r: Number(color.r ?? 255),
                g: Number(color.g ?? 128),
                b: Number(color.b ?? 64)
            };
        }
    );
}

function renderDetailManualSegmentGrid(segments) {
    const selectedSegment = Number(currentLedState.selectedSegment || 0);

    return `
        <div class="rounded-lg border border-gray-800 bg-black/20 p-3">
            <div class="flex items-center justify-between mb-3">
                <div class="text-xs text-gray-300 font-bold">Manual Segment Colors</div>
                <div class="text-xs text-purple-300">
                    Selected Segment:
                    <span id="detailSelectedSegmentLabel">${String(selectedSegment + 1).padStart(2, '0')}</span>
                </div>
            </div>

            <div id="detailLedSegmentGrid" class="grid grid-cols-4 gap-2">
                ${segments.map((color, index) => {
                    const hex = rgbToHex(color.r, color.g, color.b);
                    const isSelected = index === selectedSegment;

                    return `
                        <button
                            type="button"
                            class="detail-led-segment-swatch aspect-square rounded-lg border ${isSelected ? 'border-blue-400 ring-2 ring-blue-400/60' : 'border-white/10'}"
                            data-detail-led-segment="${index}"
                            style="background:${hex}"
                        >
                            <span class="sr-only">Segment ${index + 1}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function updateDetailManualSegmentSwatches() {
    document.querySelectorAll('[data-detail-led-segment]').forEach(button => {
        const index = Number(button.dataset.detailLedSegment);
        const color = currentLedState.segments[index];

        if (!color) return;

        button.style.background = rgbToHex(color.r, color.g, color.b);
        button.classList.toggle('border-blue-400', index === Number(currentLedState.selectedSegment || 0));
        button.classList.toggle('ring-2', index === Number(currentLedState.selectedSegment || 0));
        button.classList.toggle('ring-blue-400/60', index === Number(currentLedState.selectedSegment || 0));
    });

    const label = getElement('detailSelectedSegmentLabel');
    if (label) {
        label.textContent = String(Number(currentLedState.selectedSegment || 0) + 1).padStart(2, '0');
    }
}

export function setupLightingInputListeners(onInput) {
    const powerToggle = getElement('powerToggle');

    if (powerToggle) {
        powerToggle.addEventListener('click', () => {
            const currentState = toBoolean(powerToggle.dataset.on, true);
            const nextState = !currentState;

            console.log('[Power Toggle]', { currentState, nextState });//调试

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

    const softnessSlider = getElement('softnessSlider');

    softnessSlider?.addEventListener('input', () => {
        updateSoftnessUI();
        onInput();
    });

    const strobeSlider = getElement('strobeSlider');

    strobeSlider?.addEventListener('input', () => {
        updateStrobeUI();
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

    const detailPanel = getElement('detailLightingPanel');

    detailPanel?.addEventListener('input', event => {
        const target = event.target;

        if (target.id === 'detailIntensitySlider') {
            const value = getElement('detailIntensityValue');
            if (value) value.textContent = `${target.value}%`;
        }

        if (
            target.id === 'detailRedSlider' ||
            target.id === 'detailGreenSlider' ||
            target.id === 'detailBlueSlider'
        ) {
            updateDetailRGBUI();

            const color = {
                r: Number(
                    getElement('detailRedSlider')?.value ?? 255
                ),

                g: Number(
                    getElement('detailGreenSlider')?.value ?? 128
                ),

                b: Number(
                    getElement('detailBlueSlider')?.value ?? 64
                )
            };

            const mode =
                getElement('detailColorBlazePanel')
                    ?.dataset.ledMode;

            if (mode === 'manual') {
                const selectedSegment = Number(
                    currentLedState.selectedSegment ?? 0
                );

                currentLedState.segments[selectedSegment] = {
                    ...color
                };

                updateDetailManualSegmentSwatches();
            }

            if (mode === 'solid') {
                currentLedState.segments =
                    currentLedState.segments.map(
                        () => ({ ...color })
                    );
            }
        }

        if (target.id === 'detailStrobeHzSlider') {
            const value = getElement('detailStrobeHzValue');

            if (value) {
                value.textContent = `${target.value} Hz`;
            }
        }

        if (target.id === 'detailLedStrobeHzSlider') {
            currentLedState.strobeHz = Number(target.value);

            const value = getElement('detailLedStrobeHzValue');

            if (value) {
                value.textContent = `${target.value} Hz`;
            }
        }

        if (target.id === 'detailFieldAngleSlider') {
            const value = getElement('detailFieldAngleValue');
            const quick = getElement('fieldAngleSlider');

            if (value) value.innerHTML = `${target.value}&deg;`;
            if (quick) {
                quick.value = target.value;
                updateFieldAngleUI();
            }
        }

        if (target.id === 'detailPanSlider') {
            const value = getElement('detailPanValue');
            const quick = getElement('panSlider');

            if (value) value.innerHTML = `${target.value}&deg;`;
            if (quick) {
                quick.value = target.value;
                updatePanTiltUI();
            }
        }

        if (target.id === 'detailTiltSlider') {
            const value = getElement('detailTiltValue');
            const quick = getElement('tiltSlider');

            if (value) value.innerHTML = `${target.value}&deg;`;
            if (quick) {
                quick.value = target.value;
                updatePanTiltUI();
            }
        }

        if (target.id === 'detailSoftnessSlider') {
            const value = getElement('detailSoftnessValue');
            if (value) value.textContent = `${Math.round(Number(target.value) * 100)}%`;
        }

        if (target.id === 'detailLedChaseSpeedSlider') {
            currentLedState.chaseSpeed = Number(target.value);

            const value = getElement('detailLedChaseSpeedValue');

            if (value) {
                value.textContent = `${target.value}x`;
            }
        }

        onInput();
    });

    detailPanel?.addEventListener('click', event => {
        const powerButton = event.target.closest('[data-detail-power]');
        if (powerButton) {
            const nextState = toBoolean(powerButton.dataset.detailPower, true);

            updateDetailPowerState(nextState);
            setPowerState(nextState);
            onInput();
            return;
        }

        const angleButton = event.target.closest('[data-detail-angle]');
        if (angleButton) {
            const angle = Number(angleButton.dataset.detailAngle);
            const quick = getElement('fieldAngleSlider');

            if (quick) {
                quick.value = angle;
                updateFieldAngleUI();
            }
            
            updateQuickAngleOptionActive(angle);

            document.querySelectorAll('.detail-angle-option').forEach(button => {
                button.classList.toggle('border-blue-500', button === angleButton);
                button.classList.toggle('bg-blue-500/20', button === angleButton);
            });

            onInput();
            return;
        }

        const modeButton = event.target.closest('[data-detail-led-mode]');
        if (modeButton) {
            const panel = getElement('detailColorBlazePanel');
            const nextMode = modeButton.dataset.detailLedMode;

            if (panel) panel.dataset.ledMode = nextMode;
            currentLedState.ledMode = nextMode;

            onInput({ render: true });
            return;
        }

        const segmentModeButton = event.target.closest('[data-detail-led-segments]');
        if (segmentModeButton) {
            const panel = getElement('detailColorBlazePanel');
            const nextSegmentMode = Number(segmentModeButton.dataset.detailLedSegments);

            if (panel) {
                panel.dataset.ledSegments = String(nextSegmentMode);
            }

            currentLedState.segmentMode = nextSegmentMode;
            currentLedState.segments = normalizeLedSegments(currentLedState.segments, nextSegmentMode);

            if (currentLedState.selectedSegment >= nextSegmentMode) {
                currentLedState.selectedSegment = 0;
            }

            onInput({ render: true });
            return;
        }

        const segmentButton = event.target.closest('[data-detail-led-segment]');
        if (segmentButton) {
            const index = Number(segmentButton.dataset.detailLedSegment);
            currentLedState.selectedSegment = index;

            const color = currentLedState.segments[index] || { r: 255, g: 128, b: 64 };

            const rSlider = getElement('detailRedSlider');
            const gSlider = getElement('detailGreenSlider');
            const bSlider = getElement('detailBlueSlider');

            if (rSlider) rSlider.value = color.r;
            if (gSlider) gSlider.value = color.g;
            if (bSlider) bSlider.value = color.b;

            updateDetailRGBUI();
            updateDetailManualSegmentSwatches();
            onInput();
            return;
        }

        const directionButton = event.target.closest(
            '[data-detail-led-direction]'
        );

        if (directionButton) {
            const panel = getElement('detailColorBlazePanel');
            if (!panel) return;

            const nextDirection =
                directionButton.dataset.detailLedDirection;

            panel.dataset.ledDirection = nextDirection;
            currentLedState.direction = nextDirection;

            onInput({ render: true });
            return;
        }

        const repeatModeButton = event.target.closest(
            '[data-detail-led-repeat-mode]'
        );

        if (repeatModeButton) {
            const panel = getElement('detailColorBlazePanel');
            if (!panel) return;

            const nextRepeatMode =
                repeatModeButton.dataset.detailLedRepeatMode;

            panel.dataset.ledRepeatMode = nextRepeatMode;
            currentLedState.repeatMode = nextRepeatMode;

            onInput({ render: true });
            return;
        }
    });

    updateIntensityUI();
    updatePanTiltUI();
    updateFieldAngleUI();
    updateSoftnessUI();
    updateStrobeUI();
}