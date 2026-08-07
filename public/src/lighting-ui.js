import {
    FIXTURE_TYPES,
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel
} from './lighting-fixture.js';

import {
    clamp,
    rgbToHex
} from './lighting-color-utils.js';

import {
    getElement,
    toBoolean,
    isAdvancedLedFixture,
    getFixturePreset,
    getAngleConfig,
    sanitizeAngleForFixture,
    formatAngle,
    formatPanTilt
} from './lighting-ui-shared.js';

import {
    renderDetailRgbBlock,
    updateDetailRGBUI,
    updateDetailRgbWheelHandle,
    bindDetailRgbColorWheel
} from './lighting-ui-rgb.js';

import {
    renderDetailColorBlazeBlock,
    readColorBlazeValuesFromUI,
    handleColorBlazeInput,
    handleColorBlazeClick
} from './lighting-ui-colorblaze.js';

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
    if (isAdvancedLed) {
        Object.assign(
            state,
            readColorBlazeValuesFromUI()
        );
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
                <div class="detail-color-strobe-grid grid ${
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

function renderDetailAimBlock(
    fixture,
    preset,
    state
) {
    const isMoving =
        fixture.fixtureType ===
        FIXTURE_TYPES.MOVING;

    const title =
        isMoving
            ? 'SPATIAL MOVEMENT'
            : 'AIM';

    const panMin =
        isMoving
            ? preset?.panMin
            : preset?.aimPanMin ?? -180;

    const panMax =
        isMoving
            ? preset?.panMax
            : preset?.aimPanMax ?? 180;

    const tiltMin =
        isMoving
            ? preset?.tiltMin
            : preset?.aimTiltMin ?? -90;

    const tiltMax =
        isMoving
            ? preset?.tiltMax
            : preset?.aimTiltMax ?? 90;

    const pan = Number.isFinite(
        Number(state.pan)
    )
        ? Number(state.pan)
        : 0;

    const tilt = Number.isFinite(
        Number(state.tilt)
    )
        ? Number(state.tilt)
        : 0;

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="flex items-center gap-2 mb-3">
                <div class="text-green-400 text-xs font-bold">
                    ${title}
                </div>

                ${
                    isMoving
                        ? ''
                        : `
                            <span class="px-1.5 py-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 text-[9px] text-yellow-300">
                                Preview Only
                            </span>
                        `
                }
            </div>

            <div class="space-y-4">
                <div>
                    <div class="text-xs text-gray-300 mb-1">
                        Pan
                    </div>

                    <input
                        id="detailPanSlider"
                        type="range"
                        min="${panMin}"
                        max="${panMax}"
                        step="0.5"
                        value="${pan}"
                        class="w-full accent-blue-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                        <span>${formatPanTilt(panMin)}&deg;</span>
                        <span>0&deg;</span>
                        <span>${formatPanTilt(panMax)}&deg;</span>
                    </div>

                    <div
                        id="detailPanValue"
                        class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs"
                    >
                        ${formatPanTilt(pan)}&deg;
                    </div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-1">
                        Tilt
                    </div>

                    <input
                        id="detailTiltSlider"
                        type="range"
                        min="${tiltMin}"
                        max="${tiltMax}"
                        step="0.5"
                        value="${tilt}"
                        class="w-full accent-blue-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                        <span>${formatPanTilt(tiltMin)}&deg;</span>
                        <span>0&deg;</span>
                        <span>${formatPanTilt(tiltMax)}&deg;</span>
                    </div>

                    <div
                        id="detailTiltValue"
                        class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs"
                    >
                        ${formatPanTilt(tilt)}&deg;
                    </div>
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

    detailPanel?.addEventListener(
        'input',
        event => {
            const target = event.target;

            /*
            * ColorBlaze 专属输入：
            * - 高级 Strobe
            * - Chase Speed
            *
            * 这两类输入已经在 ColorBlaze 模块中
            * 调用了 onInput()，因此直接 return，
            * 避免重复发送。
            */
            if (
                handleColorBlazeInput(
                    target,
                    onInput
                )
            ) {
                return;
            }

            if (
                target.id ===
                'detailIntensitySlider'
            ) {
                const value =
                    getElement(
                        'detailIntensityValue'
                    );

                if (value) {
                    value.textContent =
                        `${target.value}%`;
                }
            }

            /*
            * RGB 输入：
            * ColorBlaze 内部状态已经由
            * handleColorBlazeInput() 更新。
            * 这里仅更新公共 RGB 界面。
            */
            if (
                target.id === 'detailRedSlider' ||
                target.id === 'detailGreenSlider' ||
                target.id === 'detailBlueSlider'
            ) {
                updateDetailRGBUI();
            }

            // 普通灯具 Strobe
            if (
                target.id ===
                'detailStrobeHzSlider'
            ) {
                const value =
                    getElement(
                        'detailStrobeHzValue'
                    );

                if (value) {
                    value.textContent =
                        `${target.value} Hz`;
                }
            }

            if (
                target.id ===
                'detailFieldAngleSlider'
            ) {
                const value =
                    getElement(
                        'detailFieldAngleValue'
                    );

                const quick =
                    getElement(
                        'fieldAngleSlider'
                    );

                if (value) {
                    value.innerHTML =
                        `${target.value}&deg;`;
                }

                if (quick) {
                    quick.value =
                        target.value;

                    updateFieldAngleUI();
                }
            }

            if (
                target.id ===
                'detailPanSlider'
            ) {
                const value =
                    getElement(
                        'detailPanValue'
                    );

                const quick =
                    getElement(
                        'panSlider'
                    );

                if (value) {
                    value.innerHTML =
                        `${formatPanTilt(
                            target.value
                        )}&deg;`;
                }

                if (quick) {
                    quick.value =
                        target.value;

                    updatePanTiltUI();
                }
            }

            if (
                target.id ===
                'detailTiltSlider'
            ) {
                const value =
                    getElement(
                        'detailTiltValue'
                    );

                const quick =
                    getElement(
                        'tiltSlider'
                    );

                if (value) {
                    value.innerHTML =
                        `${formatPanTilt(
                            target.value
                        )}&deg;`;
                }

                if (quick) {
                    quick.value =
                        target.value;

                    updatePanTiltUI();
                }
            }

            onInput();
        }
    );

    detailPanel?.addEventListener(
        'click',
        event => {
            const powerButton =
                event.target.closest(
                    '[data-detail-power]'
                );

            if (powerButton) {
                const nextState =
                    toBoolean(
                        powerButton.dataset
                            .detailPower,
                        true
                    );

                updateDetailPowerState(
                    nextState
                );

                setPowerState(
                    nextState
                );

                onInput();
                return;
            }

            const angleButton =
                event.target.closest(
                    '[data-detail-angle]'
                );

            if (angleButton) {
                const angle =
                    Number(
                        angleButton.dataset
                            .detailAngle
                    );

                const quick =
                    getElement(
                        'fieldAngleSlider'
                    );

                if (quick) {
                    quick.value = angle;
                    updateFieldAngleUI();
                }

                updateQuickAngleOptionActive(
                    angle
                );

                document
                    .querySelectorAll(
                        '.detail-angle-option'
                    )
                    .forEach(button => {
                        const isActive =
                            button ===
                            angleButton;

                        button.classList.toggle(
                            'border-blue-500',
                            isActive
                        );

                        button.classList.toggle(
                            'bg-blue-500/20',
                            isActive
                        );
                    });

                onInput();
                return;
            }

            if (
                handleColorBlazeClick(
                    event,
                    onInput
                )
            ) {
                return;
            }
        }
    );

    updateIntensityUI();
    updatePanTiltUI();
    updateFieldAngleUI();
    updateSoftnessUI();
    updateStrobeUI();
}