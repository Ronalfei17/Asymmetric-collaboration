import {
    FIXTURE_TYPES
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

export function readDetailLightingValuesFromUI(fixture) {
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

export function renderDetailLightingPanel(fixture, state = {}) {
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
            ${fixture.fixtureType === FIXTURE_TYPES.MOVING ? renderDetailMovingBlock() : ''}
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

function renderDetailMovingBlock() {
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-green-400 text-xs font-bold mb-2">MOVING LIGHT EXTRA</div>
            <div class="text-xs text-gray-500">
                Moving fixtures use real pan / tilt ranges from fixture preset. Strobe and beam angle are available above.
            </div>
        </section>
    `;
}

export function setupDetailLightingListeners({
    onInput,
    setPowerState,
    updateQuickAngleOptionActive,
    updateFieldAngleUI,
    updatePanTiltUI
}) {
    const detailPanel =
        getElement('detailLightingPanel');

    if (!detailPanel) {
        return;
    }

    detailPanel.addEventListener(
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
}