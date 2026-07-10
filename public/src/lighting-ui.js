// [新增]：为多类型灯具控制新加的逻辑
// [迁移]：从旧 lighting-control.js 迁移过来的 UI 策略
// [扩展]：基于原 UI 策略，为 Profile / LED / Fresnel / Moving 扩展的参数显示

import {
    FIXTURE_TYPES,
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel,
    getProfileModelPreset,
    getLedModelPreset,
    getFresnelModelPreset,
    getMovingModelPreset
} from './lighting-fixtures.js';

function getElement(id) {
    return document.getElementById(id);
}

function toHex(value) {
    return Number(value).toString(16).padStart(2, '0').toUpperCase();
}

function rgbToHex(r, g, b) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
function capsuleClass(isActive) {
    return isActive
    ? 'px-4 py-2 rounded-full text-sm font-semibold bg-blue-500 text-white border border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)] transition'
    : 'px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-gray-300 border border-gray-700 hover:bg-white/10 hover:text-white transition'
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
// [新增] 根据灯具大类显示 / 隐藏对应面板
export function updatePanelVisibility(fixtureType) {
    const profilePanel = getElement('profilePanel');
    const ledPanel = getElement('ledPanel');
    const fresnelPanel = getElement('fresnelPanel');
    const movingPanel = getElement('movingPanel');

    profilePanel?.classList.toggle('hidden', fixtureType !== FIXTURE_TYPES.PROFILE);
    ledPanel?.classList.toggle('hidden', fixtureType !== FIXTURE_TYPES.LED);
    fresnelPanel?.classList.toggle('hidden', fixtureType !== FIXTURE_TYPES.FRESNEL);
    movingPanel?.classList.toggle('hidden', fixtureType !== FIXTURE_TYPES.MOVING);
}
// [扩展] 根据具体灯具型号设置 UI 参数范围
export function applyFixturePresetToUI(fixture) {
    if (!fixture) return;

    if (fixture.fixtureType === FIXTURE_TYPES.PROFILE) {
        const preset = getProfileModelPreset(fixture.fixtureModel);
        const fieldAngleSlider = getElement('fieldAngleSlider');

        if (preset && fieldAngleSlider) {
            fieldAngleSlider.min = preset.fieldAngleMin;
            fieldAngleSlider.max = preset.fieldAngleMax;
        }
    }

    if (fixture.fixtureType === FIXTURE_TYPES.LED) {
        const preset = getLedModelPreset(fixture.fixtureModel);
        const fieldAngleSlider = getElement('fieldAngleSlider');
        const strobeBlock = getElement('strobeBlock');

        if (preset && fieldAngleSlider) {
            fieldAngleSlider.value = preset.defaultFieldAngle;
        }

        if (strobeBlock && preset) {
            strobeBlock.classList.toggle('hidden', !preset.supportsStrobe);
        }
    }

    if (fixture.fixtureType === FIXTURE_TYPES.FRESNEL) {
        const preset = getFresnelModelPreset(fixture.fixtureModel);
        const beamSizeSlider = getElement('beamSizeSlider');
        const softnessSlider = getElement('softnessSlider');

        if (preset && beamSizeSlider) {
            beamSizeSlider.value = preset.defaultBeamSize;
        }

        if (preset && softnessSlider) {
            softnessSlider.value = preset.defaultSoftness;
        }
    }

    if (fixture.fixtureType === FIXTURE_TYPES.MOVING) {
        const preset = getMovingModelPreset(fixture.fixtureModel);
        const panSlider = getElement('panSlider');
        const tiltSlider = getElement('tiltSlider');

        if (preset && panSlider) {
            panSlider.min = preset.panMin;
            panSlider.max = preset.panMax;
        }

        if (preset && tiltSlider) {
            tiltSlider.min = preset.tiltMin;
            tiltSlider.max = preset.tiltMax;
        }
    }
}
// [新增] 灯具 selected info 显示（当 light blueprint 加入后，可在主页显示）
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
}
// [迁移] 以下策略均从旧 lighting-control.js 中迁移
export function setPowerState(isOn) {
    const powerToggle = getElement('powerToggle');
    const powerKnob = getElement('powerKnob');
    const powerLamp = getElement('powerLamp');

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
    } else {
        powerToggle.className = 'w-14 h-8 rounded-full bg-gray-700 relative shadow-none transition-all';

        if (powerKnob) {
            powerKnob.className = 'absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-all';
        }

        if (powerLamp) {
            powerLamp.className = 'w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-gray-500 transition-all';
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

// [新增待完成]后续需要新增 Profile、Fresnel、LED 参数 UI 更新
function updateFieldAngleUI() {
    // TODO:
    // Update #fieldAngleValue based on #fieldAngleSlider
}

function updateBeamSizeUI() {
    // TODO:
    // Update #beamSizeValue based on #beamSizeSlider
}

function updateSoftnessUI() {
    // TODO:
    // Update #softnessValue based on #softnessSlider
}

function updateStrobeUI() {
    // TODO:
    // Update #strobeValue based on #strobeSlider
}

// [迁移完成 + 新增待完成] Read / Write UI State
// 迁移部分已经写好；新增参数留空
export function readLightingValuesFromUI() {
    const powerToggle = getElement('powerToggle');

    const intensitySlider = getElement('intensitySlider');
    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    return {
        isOn: powerToggle ? powerToggle.dataset.on === 'true' : true,

        intensity: intensitySlider ? Number(intensitySlider.value) / 100 : 0,

        r: redSlider ? Number(redSlider.value) : 255,
        g: greenSlider ? Number(greenSlider.value) : 255,
        b: blueSlider ? Number(blueSlider.value) : 255,

        pan: panSlider ? Number(panSlider.value) : 0,
        tilt: tiltSlider ? Number(tiltSlider.value) : 0,

        // [新增待完成] Profile / Fresnel / LED 参数
        // TODO:
        // fieldAngle:
        // beamSize:
        // softness:
        // strobe:
    };
}

export function writeLightingValuesToUI(state) {
    if (!state) return;

    setPowerState(Boolean(state.isOn));

    const intensitySlider = getElement('intensitySlider');

    if (intensitySlider) {
        intensitySlider.value = Math.round((state.intensity ?? 0) * 100);
    }

    const redSlider = getElement('redSlider');
    const greenSlider = getElement('greenSlider');
    const blueSlider = getElement('blueSlider');

    if (redSlider) redSlider.value = state.r ?? 255;
    if (greenSlider) greenSlider.value = state.g ?? 255;
    if (blueSlider) blueSlider.value = state.b ?? 255;

    const panSlider = getElement('panSlider');
    const tiltSlider = getElement('tiltSlider');

    if (panSlider) panSlider.value = state.pan ?? 0;
    if (tiltSlider) tiltSlider.value = state.tilt ?? 0;

    // [新增待完成] 写入 Profile / Fresnel / LED 参数
    // TODO:
    // fieldAngleSlider.value =
    // beamSizeSlider.value =
    // softnessSlider.value =
    // strobeSlider.value =

    updateIntensityUI();
    updateRGB();
    updatePanTiltUI();

    // [新增待完成] Refresh new UI values
    // TODO:
    // updateFieldAngleUI();
    // updateBeamSizeUI();
    // updateSoftnessUI();
    // updateStrobeUI();
}


// [迁移完成 + 新增待完成] Input Event Binding
// 迁移部分已经写好；新增参数事件留空

export function setupLightingInputListeners(onInput) {
    const powerToggle = getElement('powerToggle');

    if (powerToggle) {
        powerToggle.addEventListener('click', () => {
            const nextState = powerToggle.dataset.on !== 'true';
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

    // [新增待完成] Profile fieldAngle input event
    // TODO:
    // const fieldAngleSlider = getElement('fieldAngleSlider');
    // fieldAngleSlider?.addEventListener('input', () => {
    //     updateFieldAngleUI();
    //     onInput();
    // });

    // [新增待完成] Fresnel beamSize input event
    // TODO:

    // [新增待完成] Fresnel softness input event
    // TODO:

    // [新增待完成] LED / Moving strobe input event
    // TODO:

    updateIntensityUI();
    updateRGB();
    updatePanTiltUI();

    // [新增待完成] Init new UI display
    // TODO:
    // updateFieldAngleUI();
    // updateBeamSizeUI();
    // updateSoftnessUI();
    // updateStrobeUI();
}