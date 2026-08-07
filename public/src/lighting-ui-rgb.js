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

export function setDetailRgbValues(r, g, b) {
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