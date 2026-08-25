import {
    clamp,
    rgbToHex,
    rgbToHsv,
    hsvToRgb
} from './lighting-color-utils.js';

import {
    getElement
} from './lighting-ui-shared.js';

export function renderDetailRgbBlock(r, g, b, hex) {
    return `
        <section class="rounded-lg border border-gray-800 bg-[#0b0f16] p-3">
            <div class="text-red-400 text-xs font-bold mb-3">RGB COLOR</div>

            <div class="detail-rgb-layout grid grid-cols-[minmax(0,1fr)_170px] gap-4 items-center">
                <div class="space-y-3">
                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-red-400">R</span>
                        <input id="detailRedSlider" type="range" min="0" max="255" value="${r}" class="accent-red-500">
                        <input
                            id="detailRedValueInput"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            max="255"
                            step="1"
                            value="${r}"
                            aria-label="Red channel"
                            class="lighting-value-input h-8 w-12 select-text rounded border border-gray-700 bg-white/5 px-1 text-center text-xs text-gray-200 outline-none focus:border-red-500"
                        >
                    </label>

                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-green-400">G</span>
                        <input id="detailGreenSlider" type="range" min="0" max="255" value="${g}" class="accent-green-500">
                        <input
                            id="detailGreenValueInput"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            max="255"
                            step="1"
                            value="${g}"
                            aria-label="Green channel"
                            class="lighting-value-input h-8 w-12 select-text rounded border border-gray-700 bg-white/5 px-1 text-center text-xs text-gray-200 outline-none focus:border-green-500"
                        >
                    </label>

                    <label class="grid grid-cols-[18px_1fr_48px] gap-2 items-center text-xs">
                        <span class="text-blue-400">B</span>
                        <input id="detailBlueSlider" type="range" min="0" max="255" value="${b}" class="accent-blue-500">
                        <input
                            id="detailBlueValueInput"
                            type="number"
                            inputmode="numeric"
                            min="0"
                            max="255"
                            step="1"
                            value="${b}"
                            aria-label="Blue channel"
                            class="lighting-value-input h-8 w-12 select-text rounded border border-gray-700 bg-white/5 px-1 text-center text-xs text-gray-200 outline-none focus:border-blue-500"
                        >
                    </label>

                    <input
                        id="detailHexValueInput"
                        type="text"
                        inputmode="text"
                        value="${hex}"
                        maxlength="7"
                        aria-label="HEX color value"
                        class="lighting-value-input h-8 w-28 select-text rounded border border-gray-700 bg-white/5 px-2 text-center text-xs text-gray-200 uppercase outline-none focus:border-blue-500"
                    >
                </div>

                <div class="detail-rgb-visual flex min-w-0 items-center justify-center gap-3">
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

export function updateDetailRGBUI() {
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

    const rInput = getElement('detailRedValueInput');

    const gInput = getElement('detailGreenValueInput');

    const bInput = getElement('detailBlueValueInput');
    const hexInput = getElement('detailHexValueInput');
    const preview = getElement('detailColorPreview');

    if (rInput) {
        rInput.value = String(r);
    }

    if (gInput) {
        gInput.value = String(g);
    }

    if (bInput) {
        bInput.value = String(b);
    }
    if (hexInput) {
        hexInput.value = hex;
    }

    if (preview) {
        preview.style.background = hex;
    }

    updateDetailRgbWheelHandle(r, g, b);
}

export function setDetailRgbValues(
    r,
    g,
    b
) {
    r = Math.round(
        clamp(r, 0, 255)
    );

    g = Math.round(
        clamp(g, 0, 255)
    );

    b = Math.round(
        clamp(b, 0, 255)
    );

    const hex =
        rgbToHex(r, g, b);

    const redSlider =
        getElement('detailRedSlider');

    const greenSlider =
        getElement('detailGreenSlider');

    const blueSlider =
        getElement('detailBlueSlider');

    const redInput =
        getElement(
            'detailRedValueInput'
        );

    const greenInput =
        getElement(
            'detailGreenValueInput'
        );

    const blueInput =
        getElement(
            'detailBlueValueInput'
        );

    if (redSlider) {
        redSlider.value = r;
    }

    if (greenSlider) {
        greenSlider.value = g;
    }

    if (blueSlider) {
        blueSlider.value = b;
    }

    if (redInput) {
        redInput.value =
            String(r);
    }

    if (greenInput) {
        greenInput.value =
            String(g);
    }

    if (blueInput) {
        blueInput.value =
            String(b);
    }

    const hexInput =
        getElement(
            'detailHexValueInput'
        );

    if (hexInput) {
        hexInput.value = hex;
    }

    const preview =
        getElement(
            'detailColorPreview'
        );

    if (preview) {
        preview.style.background =
            hex;
    }

    updateDetailRgbWheelHandle(
        r,
        g,
        b
    );

    redSlider?.dispatchEvent(
        new Event(
            'input',
            { bubbles: true }
        )
    );
}

function hexToRgb(hex) {
    const normalized =
        String(hex)
            .trim()
            .replace(/^#/, '');

    if (
        !/^[0-9A-Fa-f]{6}$/.test(
            normalized
        )
    ) {
        return null;
    }

    return {
        r: parseInt(
            normalized.slice(0, 2),
            16
        ),
        g: parseInt(
            normalized.slice(2, 4),
            16
        ),
        b: parseInt(
            normalized.slice(4, 6),
            16
        )
    };
}

export function updateDetailRgbWheelHandle(r, g, b) {
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

export function bindDetailRgbValueInputs() {
    const bindings = [
        {
            inputId:
                'detailRedValueInput',
            sliderId:
                'detailRedSlider'
        },
        {
            inputId:
                'detailGreenValueInput',
            sliderId:
                'detailGreenSlider'
        },
        {
            inputId:
                'detailBlueValueInput',
            sliderId:
                'detailBlueSlider'
        }
    ];

    bindings.forEach(
        ({
            inputId,
            sliderId
        }) => {
            const input =
                getElement(inputId);

            const slider =
                getElement(sliderId);

            if (!input || !slider) {
                return;
            }

            input.addEventListener(
                'change',
                () => {
                    if (
                        String(input.value).trim() === ''
                    ) {
                        input.value =
                            slider.value;

                        return;
                    }

                    const raw =
                        Number(
                            input.value
                        );

                    if (
                        !Number.isFinite(raw)
                    ) {
                        input.value =
                            slider.value;

                        return;
                    }

                    const value =
                        Math.round(
                            clamp(
                                raw,
                                0,
                                255
                            )
                        );

                    slider.value =
                        String(value);

                    input.value =
                        String(value);

                    slider.dispatchEvent(
                        new Event(
                            'input',
                            {
                                bubbles: true
                            }
                        )
                    );
                }
            );

            input.addEventListener(
                'focus',
                () => {
                    input.select();
                }
            );
        }
    );

    const hexInput =
        getElement(
            'detailHexValueInput'
        );

    hexInput?.addEventListener(
        'change',
        () => {
            const rgb =
                hexToRgb(
                    hexInput.value
                );

            if (!rgb) {
                const currentHex =
                    rgbToHex(
                        Number(
                            getElement(
                                'detailRedSlider'
                            )?.value ?? 255
                        ),
                        Number(
                            getElement(
                                'detailGreenSlider'
                            )?.value ?? 128
                        ),
                        Number(
                            getElement(
                                'detailBlueSlider'
                            )?.value ?? 64
                        )
                    );

                hexInput.value =
                    currentHex;

                return;
            }

            setDetailRgbValues(
                rgb.r,
                rgb.g,
                rgb.b
            );
        }
    );

    hexInput?.addEventListener(
        'focus',
        () => {
            hexInput.select();
        }
    );
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

export function bindDetailRgbColorWheel() {
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
