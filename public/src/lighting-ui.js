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

function toHex(value) {
    return Number(value).toString(16).padStart(2, '0').toUpperCase();
}

function rgbToHex(r, g, b) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
    strobeHz: 0
};

function getSelectedLedMode() {
    return getElement('detailColorBlazePanel')?.dataset.ledMode ||
           getElement('colorBlazePanel')?.dataset.ledMode ||
           'solid';
}

function getSelectedLedDirection() {
    return getElement('detailColorBlazePanel')?.dataset.ledDirection ||
           getElement('colorBlazePanel')?.dataset.ledDirection ||
           'forward';
}

function getSelectedLedSegmentMode() {
    return Number(
        getElement('detailColorBlazePanel')?.dataset.ledSegments ||
        getElement('colorBlazePanel')?.dataset.ledSegments ||
        8
    );
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
    }

    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
}

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}
// [新增] Fixture Type 胶囊按钮样式和显示策略
// [修改] 胶囊按钮样式
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
        const isActive = Number(option.dataset.angle) === Number(angle);
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

function applyQuickAnglePreset(fixture, preset) {
    const sliderWrap = getElement('quickAngleSliderWrap');
    const fixedWrap = getElement('quickAngleFixedWrap');
    const fixedValue = getElement('quickAngleFixedValue');
    const optionsWrap = getElement('quickAngleOptionsWrap');
    const slider = getElement('fieldAngleSlider');

    const minLabel = getElement('fieldAngleMinLabel');
    const maxLabel = getElement('fieldAngleMaxLabel');

    if (!preset) return;

    const angleOptions = preset.fieldAngleOptions ?? preset.beamAngleOptions;
    const angleMin = preset.fieldAngleMin ?? preset.beamAngleMin;
    const angleMax = preset.fieldAngleMax ?? preset.beamAngleMax;
    const defaultAngle =
        fixture.defaultState?.fieldAngle ??
        preset.defaultFieldAngle ??
        preset.defaultBeamAngle ??
        angleOptions?.[0] ??
        angleMin ??
        30;

    const hasOptions = Array.isArray(angleOptions) && angleOptions.length > 0;
    const isFixed = Boolean(preset.fieldAngleFixed) || (
        angleMin !== undefined &&
        angleMax !== undefined &&
        Number(angleMin) === Number(angleMax)
    );

    sliderWrap?.classList.toggle('hidden', hasOptions || isFixed);
    fixedWrap?.classList.toggle('hidden', !isFixed);
    fixedWrap?.classList.toggle('flex', isFixed);
    optionsWrap?.classList.toggle('hidden', !hasOptions);
    optionsWrap?.classList.toggle('flex', hasOptions);

    if (hasOptions) {
        const selectedAngle = angleOptions.includes(Number(defaultAngle))
            ? Number(defaultAngle)
            : Number(preset.defaultFieldAngle ?? preset.defaultBeamAngle ?? angleOptions[0]);

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

function updateWheelMarkerFromRGB() {
    const colorWheelMarker = getElement('colorWheelMarker');
    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    if (!colorWheelMarker || !redSlider || !greenSlider || !blueSlider) return;

    const r = Number(redSlider.value);
    const g = Number(greenSlider.value);
    const b = Number(blueSlider.value);

    const { h, s } = rgbToHsv(r, g, b);

    const angle = (h - 90) * Math.PI / 180;
    const radius = 22 * clamp(s, 0.25, 1);

    const x = 28 + Math.cos(angle) * radius;
    const y = 28 + Math.sin(angle) * radius;

    colorWheelMarker.style.left = `${x}px`;
    colorWheelMarker.style.top = `${y}px`;
}

function updateRGB() {
    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    const redValue = getElement('redValue');
    const greenValue = getElement('greenValue');
    const blueValue = getElement('blueValue');
    const hexValue = getElement('hexValue');
    const colorPreview = getElement('colorPreview');

    if (!redSlider || !greenSlider || !blueSlider) return;

    const r = redSlider.value;
    const g = greenSlider.value;
    const b = blueSlider.value;
    const hex = rgbToHex(r, g, b);

    if (redValue) redValue.innerText = r;
    if (greenValue) greenValue.innerText = g;
    if (blueValue) blueValue.innerText = b;
    if (hexValue) hexValue.innerText = hex;

    if (colorPreview) {
        colorPreview.style.backgroundColor = hex;
        colorPreview.style.boxShadow = `0 0 12px ${hex}66`;
    }

    updateWheelMarkerFromRGB();
}

function updateDetailRGBUI() {
    const r = Number(getElement('detailRedSlider')?.value || 255);
    const g = Number(getElement('detailGreenSlider')?.value || 128);
    const b = Number(getElement('detailBlueSlider')?.value || 64);
    const hex = rgbToHex(r, g, b);

    const rValue = getElement('detailRedValue');
    const gValue = getElement('detailGreenValue');
    const bValue = getElement('detailBlueValue');
    const hexValue = getElement('detailHexValue');
    const preview = getElement('detailColorPreview');

    if (rValue) rValue.textContent = r;
    if (gValue) gValue.textContent = g;
    if (bValue) bValue.textContent = b;
    if (hexValue) hexValue.textContent = hex;
    if (preview) preview.style.background = hex;
}

function updateRGBFromWheel(event) {
    const colorWheel = getElement('colorWheel');
    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    if (!colorWheel || !redSlider || !greenSlider || !blueSlider) return;

    const rect = colorWheel.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = point.clientX - centerX;
    const dy = point.clientY - centerY;

    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = rect.width / 2;

    const hue = (angle * 180 / Math.PI + 90 + 360) % 360;
    const saturation = clamp(distance / radius, 0, 1);

    const current = rgbToHsv(
        Number(redSlider.value),
        Number(greenSlider.value),
        Number(blueSlider.value)
    );

    const rgb = hsvToRgb(hue, saturation, current.v || 1);

    redSlider.value = rgb.r;
    greenSlider.value = rgb.g;
    blueSlider.value = rgb.b;

    updateRGB();
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

function updateBeamSizeUI() {
    const slider = getElement('beamSizeSlider');
    const value = getElement('beamSizeValue');

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

function writeColorBlazeValuesToUI(state) {
    if (!state) return;

    const panel = getElement('colorBlazePanel');
    if (!panel) return;

    panel.dataset.ledMode = state.ledMode || 'solid';
    panel.dataset.ledSegments = String(state.segmentMode || 8);
    panel.dataset.ledDirection = state.direction || 'forward';

    currentLedState = {
        ...currentLedState,
        ledMode: state.ledMode || 'solid',
        segmentMode: Number(state.segmentMode || 8),
        selectedSegment: Number(state.selectedSegment || 0),
        segments: Array.isArray(state.segments) && state.segments.length
            ? state.segments
            : createDefaultSegments(Number(state.segmentMode || 8)),
        chaseSpeed: Number(state.chaseSpeed || 1.5),
        direction: state.direction || 'forward',
        strobeHz: Number(state.strobeHz || 0)
    };

    const chaseSpeedSlider = getElement('ledChaseSpeedSlider');
    const chaseSpeedValue = getElement('ledChaseSpeedValue');

    if (chaseSpeedSlider && state.chaseSpeed !== undefined) {
        chaseSpeedSlider.value = state.chaseSpeed;
    }

    if (chaseSpeedSlider && chaseSpeedValue) {
        chaseSpeedValue.innerText = `${chaseSpeedSlider.value}x`;
    }

    const strobeHzSlider = getElement('ledStrobeHzSlider');
    const strobeHzValue = getElement('ledStrobeHzValue');

    if (strobeHzSlider && state.strobeHz !== undefined) {
        strobeHzSlider.value = state.strobeHz;
    }

    if (strobeHzSlider && strobeHzValue) {
        strobeHzValue.innerText = `${strobeHzSlider.value} Hz`;
    }

    const color = state.color || {
        r: state.r,
        g: state.g,
        b: state.b
    };
    const rSlider = getElement('ledColorRSlider');
    const gSlider = getElement('ledColorGSlider');
    const bSlider = getElement('ledColorBSlider');

    if (rSlider && color.r !== undefined) rSlider.value = color.r;
    if (gSlider && color.g !== undefined) gSlider.value = color.g;
    if (bSlider && color.b !== undefined) bSlider.value = color.b;

    updateColorBlazeUI();
}

function readColorBlazeValuesFromUI() {
    const mode = getSelectedLedMode();
    const segmentMode = Number(getSelectedLedSegmentMode() || 8);
    const selectedSegment = Number(currentLedState.selectedSegment || 0);

    const segments = currentLedState.segments?.length
        ? [...currentLedState.segments]
        : createDefaultSegments(segmentMode);

    if (mode === 'manual') {
        segments[selectedSegment] = {
            r: Number(getElement('ledColorRSlider')?.value || 255),
            g: Number(getElement('ledColorGSlider')?.value || 128),
            b: Number(getElement('ledColorBSlider')?.value || 64)
        };
    }

    return {
        ledMode: mode,
        segmentMode,
        selectedSegment,
        segments,
        chaseSpeed: Number(getElement('ledChaseSpeedSlider')?.value || 1.5),
        direction: getSelectedLedDirection(),
        strobeHz: Number(getElement('ledStrobeHzSlider')?.value || 0)
    };
}

function renderLedSegmentGrid() {
    const grid = getElement('ledSegmentGrid');
    const label = getElement('ledSelectedSegmentLabel');

    if (!grid) return;

    const segmentMode = Number(currentLedState.segmentMode || 8);
    const segments = currentLedState.segments?.length === segmentMode
        ? currentLedState.segments
        : createDefaultSegments(segmentMode);

    currentLedState.segments = segments;
    if (Number(currentLedState.selectedSegment || 0) >= segments.length) {
        currentLedState.selectedSegment = 0;
    }

    grid.innerHTML = '';

    segments.forEach((color, index) => {
        const button = document.createElement('button');
        const isSelected = index === Number(currentLedState.selectedSegment || 0);
        const hex = rgbToHex(color.r, color.g, color.b);

        button.type = 'button';
        button.className = [
            'h-8 rounded border transition',
            isSelected ? 'border-blue-400 ring-2 ring-blue-500/40' : 'border-white/10'
        ].join(' ');
        button.style.backgroundColor = hex;
        button.dataset.segmentIndex = String(index);
        button.title = `Segment ${String(index + 1).padStart(2, '0')} ${hex}`;

        button.addEventListener('click', () => {
            currentLedState.selectedSegment = index;

            const selectedColor = currentLedState.segments[index];

            const rSlider = getElement('ledColorRSlider');
            const gSlider = getElement('ledColorGSlider');
            const bSlider = getElement('ledColorBSlider');

            if (rSlider) rSlider.value = selectedColor.r;
            if (gSlider) gSlider.value = selectedColor.g;
            if (bSlider) bSlider.value = selectedColor.b;

            updateColorBlazeUI();
        });

        grid.appendChild(button);
    });

    if (label) {
        label.innerText = String(Number(currentLedState.selectedSegment || 0) + 1).padStart(2, '0');
    }
}

function updateColorBlazeUI() {
    const panel = getElement('colorBlazePanel');
    if (!panel) return;

    const ledMode = panel.dataset.ledMode || 'solid';
    const segmentMode = Number(panel.dataset.ledSegments || 8);
    const direction = panel.dataset.ledDirection || 'forward';

    currentLedState = {
        ...currentLedState,
        ledMode,
        segmentMode,
        direction,
        chaseSpeed: Number(getElement('ledChaseSpeedSlider')?.value || currentLedState.chaseSpeed || 1.5),
        strobeHz: Number(getElement('ledStrobeHzSlider')?.value || currentLedState.strobeHz || 0)
    };

    document.querySelectorAll('[data-led-mode]').forEach(button => {
        const isActive = button.dataset.ledMode === ledMode;

        button.classList.toggle('bg-blue-500/20', isActive);
        button.classList.toggle('border-blue-500/70', isActive);
        button.classList.toggle('text-blue-300', isActive);
        button.classList.toggle('text-gray-300', !isActive);
    });

    document.querySelectorAll('[data-led-segments]').forEach(button => {
        const isActive = Number(button.dataset.ledSegments) === segmentMode;

        button.classList.toggle('bg-blue-500/20', isActive);
        button.classList.toggle('border-blue-500/70', isActive);
        button.classList.toggle('text-blue-300', isActive);
        button.classList.toggle('text-gray-300', !isActive);
    });

    document.querySelectorAll('[data-led-direction]').forEach(button => {
        const isActive = button.dataset.ledDirection === direction;

        button.classList.toggle('bg-green-500/10', isActive);
        button.classList.toggle('border-green-500/70', isActive);
        button.classList.toggle('text-green-400', isActive);
        button.classList.toggle('text-gray-300', !isActive);
    });

    const manualPanel = getElement('ledManualPanel');
    manualPanel?.classList.toggle('hidden', ledMode !== 'manual');
    if (ledMode === 'manual') {
        renderLedSegmentGrid();
    }

    const chaseSpeedSlider = getElement('ledChaseSpeedSlider');
    const chaseSpeedValue = getElement('ledChaseSpeedValue');

    if (chaseSpeedSlider && chaseSpeedValue) {
        chaseSpeedValue.innerText = `${chaseSpeedSlider.value}x`;
    }

    const strobeHzSlider = getElement('ledStrobeHzSlider');
    const strobeHzValue = getElement('ledStrobeHzValue');

    if (strobeHzSlider && strobeHzValue) {
        strobeHzValue.innerText = `${strobeHzSlider.value} Hz`;
    }

    const r = Number(getElement('ledColorRSlider')?.value || 255);
    const g = Number(getElement('ledColorGSlider')?.value || 128);
    const b = Number(getElement('ledColorBSlider')?.value || 64);
    const hex = rgbToHex(r, g, b);

    const colorPreview = getElement('ledColorPreview');
    const hexValue = getElement('ledHexValue');

    if (colorPreview) {
        colorPreview.style.backgroundColor = hex;
        colorPreview.style.boxShadow = `0 0 12px ${hex}66`;
    }

    if (hexValue) {
        hexValue.innerText = hex;
    }

    const rValue = getElement('ledColorRValue');
    const gValue = getElement('ledColorGValue');
    const bValue = getElement('ledColorBValue');

    if (rValue) rValue.innerText = r;
    if (gValue) gValue.innerText = g;
    if (bValue) bValue.innerText = b;
}

export function readLightingValuesFromUI() {
    const powerToggle = getElement('powerToggle');
    const intensitySlider = getElement('intensitySlider');
    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');
    const fieldAngleSlider = getElement('fieldAngleSlider');

    const detailPage = getElement('page-light');
    const isDetailPageActive = detailPage && !detailPage.classList.contains('hidden');

    const detailState = isDetailPageActive
        ? readDetailLightingValuesFromUI()
        : {};

    return {
        ...detailState,
        isOn: powerToggle ? toBoolean(powerToggle.dataset.on, true) : true,
        intensity: intensitySlider ? Number(intensitySlider.value) / 100 : 0,
        fieldAngle: fieldAngleSlider ? Number(fieldAngleSlider.value) : undefined,
        pan: panSlider ? Number(panSlider.value) : 0,
        tilt: tiltSlider ? Number(tiltSlider.value) : 0
    };
}

function readDetailLightingValuesFromUI() {
    const detailRedSlider = getElement('detailRedSlider');
    const detailGreenSlider = getElement('detailGreenSlider');
    const detailBlueSlider = getElement('detailBlueSlider');
    const detailStrobeHzSlider = getElement('detailStrobeHzSlider');

    const detailBeamSizeSlider = getElement('detailBeamSizeSlider');
    const detailSoftnessSlider = getElement('detailSoftnessSlider');

    const detailColorBlazePanel = getElement('detailColorBlazePanel');

    const state = {};

    if (detailRedSlider) state.r = Number(detailRedSlider.value);
    if (detailGreenSlider) state.g = Number(detailGreenSlider.value);
    if (detailBlueSlider) state.b = Number(detailBlueSlider.value);
    if (detailStrobeHzSlider) state.strobeHz = Number(detailStrobeHzSlider.value);

    if (detailBeamSizeSlider) state.beamSize = Number(detailBeamSizeSlider.value);
    if (detailSoftnessSlider) state.softness = Number(detailSoftnessSlider.value);

    if (detailColorBlazePanel) {
        state.ledMode = detailColorBlazePanel.dataset.ledMode || 'solid';
        state.segmentMode = Number(detailColorBlazePanel.dataset.ledSegments || 8);
        state.chaseSpeed = Number(getElement('detailLedChaseSpeedSlider')?.value || 1.5);
        state.direction = detailColorBlazePanel.dataset.ledDirection || 'forward';
        state.segments = currentLedState.segments;
        state.selectedSegment = currentLedState.selectedSegment;
    }

    return state;
}

export function writeLightingValuesToUI(state, fixture) {
    if (!state) return;

    setPowerState(toBoolean(state.isOn, true));

    const intensitySlider = getElement('intensitySlider');
    if (intensitySlider && state.intensity !== undefined) {
        intensitySlider.value = Math.round(Number(state.intensity) * 100);
    }

    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    if (panSlider && state.pan !== undefined) panSlider.value = state.pan;
    if (tiltSlider && state.tilt !== undefined) tiltSlider.value = state.tilt;

    const fieldAngleSlider = getElement('fieldAngleSlider');
    if (fieldAngleSlider && state.fieldAngle !== undefined) {
        fieldAngleSlider.value = state.fieldAngle;
    }

    if (state.fieldAngle !== undefined) {
        updateQuickAngleOptionActive(state.fieldAngle);
    }

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
                ${renderDetailRgbBlock(r, g, b, hex)}
                ${renderDetailStrobeBlock(state)}
            </div>

            <div class="grid grid-cols-2 gap-3">
                ${renderDetailAngleBlock(fixture, preset, state, angleTitle)}
                ${renderDetailAimBlock(fixture, preset, state)}
            </div>

            ${fixture.fixtureType === FIXTURE_TYPES.FRESNEL ? renderDetailFresnelBlock(state) : ''}
            ${fixture.fixtureType === FIXTURE_TYPES.MOVING ? renderDetailMovingBlock(fixture, preset, state) : ''}
            ${fixture.fixtureType === FIXTURE_TYPES.LED && isAdvancedLed ? renderDetailColorBlazeBlock(state) : ''}
        </div>
    `;
}

function renderDetailRgbBlock(r, g, b, hex) {
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-red-400 text-xs font-bold mb-3">RGB COLOR</div>

            <div class="grid grid-cols-[1fr_72px] gap-3 items-center">
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

                <div id="detailColorPreview" class="w-16 h-16 rounded-lg border border-white/10 shadow-lg" style="background:${hex}"></div>
            </div>
        </section>
    `;
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
    const value = Number(state.fieldAngle ?? fixture.defaultState?.fieldAngle ?? preset?.defaultFieldAngle ?? preset?.defaultBeamAngle ?? 30);

    if (Array.isArray(preset?.beamAngleOptions)) {
        return `
            <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
                <div class="text-blue-400 text-xs font-bold mb-3">${title.toUpperCase()}</div>
                <div class="grid grid-cols-2 gap-2">
                    ${preset.beamAngleOptions.map(angle => `
                        <button
                            type="button"
                            class="detail-angle-option px-3 py-2 rounded-md border ${Number(angle) === value ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-gray-700 bg-white/5 text-gray-300'}"
                            data-detail-angle="${angle}"
                        >
                            ${angle}&deg;
                        </button>
                    `).join('')}
                </div>
            </section>
        `;
    }

    const min = preset?.beamAngleMin ?? preset?.fieldAngleMin ?? value;
    const max = preset?.beamAngleMax ?? preset?.fieldAngleMax ?? value;
    const isFixed = preset?.fieldAngleFixed || min === max;

    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-blue-400 text-xs font-bold mb-3">${title.toUpperCase()}</div>

            ${isFixed ? `
                <div class="h-24 flex items-center justify-center">
                    <div class="px-6 py-3 rounded-lg border border-gray-700 bg-white/5 text-2xl">${value}&deg;</div>
                </div>
            ` : `
                <input id="detailFieldAngleSlider" type="range" min="${min}" max="${max}" step="0.1" value="${value}" class="w-full accent-blue-500">
                <div class="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>${min}&deg;</span>
                    <span>${max}&deg;</span>
                </div>
                <div id="detailFieldAngleValue" class="mx-auto mt-3 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${value}&deg;</div>
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
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-yellow-400 text-xs font-bold mb-3">FRESNEL BEAM</div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <div class="text-xs text-gray-300 mb-1">Beam Size</div>
                    <input id="detailBeamSizeSlider" type="range" min="0" max="100" value="${state.beamSize ?? 45}" class="w-full accent-yellow-500">
                    <div id="detailBeamSizeValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${state.beamSize ?? 45}&deg;</div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-1">Softness</div>
                    <input id="detailSoftnessSlider" type="range" min="0" max="1" step="0.01" value="${state.softness ?? 0.75}" class="w-full accent-purple-500">
                    <div id="detailSoftnessValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${Math.round(Number(state.softness ?? 0.75) * 100)}%</div>
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

function renderDetailColorBlazeBlock(state) {
    const mode = state.ledMode || 'solid';
    const segmentMode = Number(state.segmentMode || 8);
    const chaseSpeed = Number(state.chaseSpeed || 1.5);
    const direction = state.direction || 'forward';

    const segments = normalizeLedSegments(state.segments, segmentMode);
    currentLedState = {
        ...currentLedState,
        ledMode: mode,
        segmentMode,
        selectedSegment: Number(state.selectedSegment || 0),
        segments,
        chaseSpeed,
        direction,
        strobeHz: Number(state.strobeHz || 0)
    };

    return `
        <section
            id="detailColorBlazePanel"
            class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3"
            data-led-mode="${mode}"
            data-led-segments="${segmentMode}"
            data-led-direction="${direction}"
        >
            <div class="text-red-400 text-xs font-bold mb-3">COLORBLAZE 48 MODE</div>

            <div class="grid grid-cols-4 gap-1 rounded-lg border border-gray-700 p-1 mb-3">
                ${['solid', 'gradient', 'chase', 'manual'].map(item => `
                    <button
                        type="button"
                        class="detail-led-mode-btn h-8 rounded-md text-xs ${mode === item ? 'bg-blue-500/30 text-blue-200 border border-blue-500' : 'text-gray-300'}"
                        data-detail-led-mode="${item}"
                    >
                        ${item.toUpperCase()}
                    </button>
                `).join('')}
            </div>

            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div class="text-xs text-gray-300 mb-2">Segment Mode</div>
                    <div class="grid grid-cols-2 gap-1 rounded-lg border border-gray-700 p-1">
                        <button type="button" data-detail-led-segments="4" class="detail-led-segment-mode h-8 rounded-md text-xs ${segmentMode === 4 ? 'bg-blue-500/30 text-blue-200' : 'text-gray-300'}">4 Segments</button>
                        <button type="button" data-detail-led-segments="8" class="detail-led-segment-mode h-8 rounded-md text-xs ${segmentMode === 8 ? 'bg-blue-500/30 text-blue-200' : 'text-gray-300'}">8 Segments</button>
                    </div>
                </div>

                <div>
                    <div class="text-xs text-gray-300 mb-2">Chase Speed</div>
                    <input id="detailLedChaseSpeedSlider" type="range" min="0.1" max="5" step="0.1" value="${chaseSpeed}" class="w-full accent-green-500">
                    <div id="detailLedChaseSpeedValue" class="mx-auto mt-2 w-16 py-1 rounded border border-gray-700 bg-white/5 text-center text-xs">${chaseSpeed}x</div>
                </div>
            </div>

            ${mode === 'manual' ? renderDetailManualSegmentGrid(segments) : ''}

            ${mode === 'gradient' ? `
                <div class="text-xs text-gray-400 rounded-lg border border-gray-800 bg-black/20 p-3">
                    Gradient mode uses Color A to Color B across selected segments.
                </div>
            ` : ''}

            ${mode === 'chase' ? `
                <div class="text-xs text-gray-400 rounded-lg border border-gray-800 bg-black/20 p-3">
                    Chase mode animates Color 1 to Color 2 with chase speed.
                </div>
            ` : ''}
        </section>
    `;
}

function normalizeLedSegments(segments, count) {
    if (Array.isArray(segments) && segments.length === count) {
        return segments.map(color => ({
            r: Number(color.r ?? 255),
            g: Number(color.g ?? 128),
            b: Number(color.b ?? 64)
        }));
    }

    return createDefaultSegments(count);
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

    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    [redSlider, greenSlider, blueSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', () => {
                updateRGB();
                onInput();
            });
        }
    });

    let isDraggingColorWheel = false;
    const colorWheel = getElement('colorWheel');

    if (colorWheel) {
        colorWheel.addEventListener('pointerdown', event => {
            isDraggingColorWheel = true;
            colorWheel.setPointerCapture(event.pointerId);
            updateRGBFromWheel(event);
            onInput();
        });

        colorWheel.addEventListener('pointermove', event => {
            if (!isDraggingColorWheel) return;
            updateRGBFromWheel(event);
            onInput();
        });

        colorWheel.addEventListener('pointerup', () => {
            isDraggingColorWheel = false;
        });

        colorWheel.addEventListener('pointercancel', () => {
            isDraggingColorWheel = false;
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

    const beamSizeSlider = getElement('beamSizeSlider');

    beamSizeSlider?.addEventListener('input', () => {
        updateBeamSizeUI();
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

    getElement('ledChaseSpeedSlider')?.addEventListener('input', () => {
        updateColorBlazeUI();
        onInput();
    });

    getElement('ledStrobeHzSlider')?.addEventListener('input', () => {
        updateColorBlazeUI();
        onInput();
    });

    getElement('ledResetEffectsBtn')?.addEventListener('click', () => {
        currentLedState = {
            ...currentLedState,
            ledMode: 'solid',
            segmentMode: 8,
            selectedSegment: 0,
            segments: createDefaultSegments(8),
            chaseSpeed: 1.5,
            direction: 'forward',
            strobeHz: 0
        };

        const panel = getElement('colorBlazePanel');
        if (panel) {
            panel.dataset.ledMode = 'solid';
            panel.dataset.ledSegments = '8';
            panel.dataset.ledDirection = 'forward';
        }

        const chaseSpeedSlider = getElement('ledChaseSpeedSlider');
        const strobeHzSlider = getElement('ledStrobeHzSlider');

        if (chaseSpeedSlider) chaseSpeedSlider.value = 1.5;
        if (strobeHzSlider) strobeHzSlider.value = 0;

        const rSlider = getElement('ledColorRSlider');
        const gSlider = getElement('ledColorGSlider');
        const bSlider = getElement('ledColorBSlider');

        if (rSlider) rSlider.value = 255;
        if (gSlider) gSlider.value = 128;
        if (bSlider) bSlider.value = 64;

        updateColorBlazeUI();
        onInput();
    });

    [
        getElement('ledColorRSlider'),
        getElement('ledColorGSlider'),
        getElement('ledColorBSlider')
    ].forEach(slider => {
        slider?.addEventListener('input', () => {
            if (getSelectedLedMode() === 'manual') {
                const selectedSegment = Number(currentLedState.selectedSegment || 0);

                currentLedState.segments[selectedSegment] = {
                    r: Number(getElement('ledColorRSlider')?.value || 255),
                    g: Number(getElement('ledColorGSlider')?.value || 128),
                    b: Number(getElement('ledColorBSlider')?.value || 64)
                };
            }

            updateColorBlazeUI();
            onInput();
        });
    });

    document.querySelectorAll('.led-mode-btn').forEach(button => {
        button.addEventListener('click', () => {
            const panel = getElement('colorBlazePanel');
            if (!panel) return;
            panel.dataset.ledMode = button.dataset.ledMode;
            updateColorBlazeUI();
            onInput();
        });
    });

    document.querySelectorAll('[data-led-segments]').forEach(button => {
        button.addEventListener('click', () => {
            const colorBlazePanel = getElement('colorBlazePanel');

            if (colorBlazePanel) {
                colorBlazePanel.dataset.ledSegments = button.dataset.ledSegments;
            }

            updateColorBlazeUI();
            onInput();
        });
    });

    document.querySelectorAll('[data-led-direction]').forEach(button => {
        button.addEventListener('click', () => {
            const colorBlazePanel = getElement('colorBlazePanel');

            if (colorBlazePanel) {
                colorBlazePanel.dataset.ledDirection = button.dataset.ledDirection;
            }

            updateColorBlazeUI();
            onInput();
        });
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

        if (target.id === 'detailRedSlider' || target.id === 'detailGreenSlider' || target.id === 'detailBlueSlider') {
            updateDetailRGBUI();

            if (getSelectedLedMode() === 'manual') {
                const selectedSegment = Number(currentLedState.selectedSegment || 0);

                currentLedState.segments[selectedSegment] = {
                    r: Number(getElement('detailRedSlider')?.value || 255),
                    g: Number(getElement('detailGreenSlider')?.value || 128),
                    b: Number(getElement('detailBlueSlider')?.value || 64)
                };

                updateDetailManualSegmentSwatches();
            }
        }

        if (target.id === 'detailStrobeHzSlider') {
            const value = getElement('detailStrobeHzValue');
            if (value) value.textContent = `${target.value} Hz`;
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

        if (target.id === 'detailBeamSizeSlider') {
            const value = getElement('detailBeamSizeValue');
            if (value) value.innerHTML = `${target.value}&deg;`;
        }

        if (target.id === 'detailSoftnessSlider') {
            const value = getElement('detailSoftnessValue');
            if (value) value.textContent = `${Math.round(Number(target.value) * 100)}%`;
        }

        if (target.id === 'detailLedChaseSpeedSlider') {
            const value = getElement('detailLedChaseSpeedValue');
            if (value) value.textContent = `${target.value}x`;
        }

        onInput();
    });

    detailPanel?.addEventListener('click', event => {
        const angleButton = event.target.closest('[data-detail-angle]');
        if (angleButton) {
            const angle = Number(angleButton.dataset.detailAngle);
            const quick = getElement('fieldAngleSlider');

            if (quick) {
                quick.value = angle;
                updateFieldAngleUI();
            }

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
    });

    updateIntensityUI();
    updateRGB();
    updatePanTiltUI();

    updateFieldAngleUI();
    updateBeamSizeUI();
    updateSoftnessUI();
    updateStrobeUI();
    updateColorBlazeUI();
}