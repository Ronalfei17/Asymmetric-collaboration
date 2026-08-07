import {
    rgbToHex,
    normalizeRgbColor255
} from './lighting-color-utils.js';

import {
    getElement
} from './lighting-ui-shared.js';

import {
    renderDetailRgbBlock,
    setDetailRgbValues
} from './lighting-ui-rgb.js';

function createDefaultSegments(count = 8) {
    return Array.from({ length: count }, () => ({
        r: 255,
        g: 128,
        b: 64
    }));
}

function createDefaultColorBlazeState() {
    return {
        ledMode: 'solid',
        segmentMode: 8,
        selectedSegment: 0,
        segments: createDefaultSegments(8),

        colorA: {
            r: 255,
            g: 128,
            b: 64
        },

        colorB: {
            r: 64,
            g: 200,
            b: 255
        },

        editingColorTarget: 'colorA',

        chaseSpeed: 1.5,
        direction: 'forward',
        repeatMode: 'single',
        strobeHz: 0
    };
}

let currentLedState =
    createDefaultColorBlazeState();

export function renderDetailColorBlazeBlock(state = {}) {
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

    const colorA = normalizeRgbColor255(
        state.colorA ?? {
            r: state.r,
            g: state.g,
            b: state.b
        },
        {
            r: 255,
            g: 128,
            b: 64
        }
    );

    const colorB = normalizeRgbColor255(
        state.colorB,
        {
            r: 64,
            g: 200,
            b: 255
        }
    );

    const selectedSegment = Math.max(
        0,
        Math.min(
            Number(state.selectedSegment ?? 0),
            segments.length - 1
        )
    );

    currentLedState = {
        ...currentLedState,
        ledMode: mode,
        segmentMode,
        selectedSegment,
        segments,
        colorA,
        colorB,
        chaseSpeed,
        direction,
        repeatMode,
        strobeHz
    };

    let editorHtml = '';

    if (mode === 'solid') {
        editorHtml = renderColorBlazeSolidEditor({
            color: normalizeRgbColor255(
                {
                    r: state.r,
                    g: state.g,
                    b: state.b
                },
                colorA
            ),
            strobeHz
        });
    }

    if (mode === 'gradient') {
        editorHtml = renderColorBlazeGradientEditor({
            segmentMode,
            colorA,
            colorB,
            direction,
            repeatMode,
            strobeHz
        });
    }

    if (mode === 'chase') {
        editorHtml = renderColorBlazeChaseEditor({
            segmentMode,
            colorA,
            colorB,
            chaseSpeed,
            direction,
            strobeHz
        });
    }

    if (mode === 'manual') {
        editorHtml = renderColorBlazeManualEditor({
            segmentMode,
            selectedSegment,
            segments,
            strobeHz
        });
    }

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
                            class="h-9 rounded-md border text-xs transition ${
                                mode === item
                                    ? 'bg-blue-500/30 text-blue-200 border-blue-500'
                                    : 'bg-transparent text-gray-300 border-transparent hover:bg-white/5'
                            }"
                        >
                            ${item.toUpperCase()}
                        </button>
                    `)
                    .join('')}
            </div>

            ${editorHtml}
        </section>
    `;
}

function renderColorBlazeSolidEditor({
    color,
    strobeHz
}) {
    const solidColor = {
        r: Number(color?.r ?? 255),
        g: Number(color?.g ?? 128),
        b: Number(color?.b ?? 64)
    };

    const hex = rgbToHex(
        solidColor.r,
        solidColor.g,
        solidColor.b
    );

    return `
        <div class="detail-colorblaze-editor grid grid-cols-[minmax(0,1fr)_300px] gap-3">
            <div class="space-y-3">
                <div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                    <div class="text-xs text-blue-300">
                        Solid mode applies one color to the entire fixture.
                    </div>
                </div>

                <div class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs text-gray-400 mb-2">
                        Segment Mode
                    </div>

                    <div class="inline-flex min-w-[180px] rounded-md border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
                        Whole Fixture
                    </div>
                </div>

                ${renderDetailRgbBlock(
                    solidColor.r,
                    solidColor.g,
                    solidColor.b,
                    hex
                )}
            </div>

            <div class="space-y-3">
                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-green-400 text-xs font-bold mb-3">
                        LED EFFECTS
                    </div>

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
                        class="w-full accent-blue-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>0 Hz</span>
                        <span>20 Hz</span>
                    </div>

                    <div
                        id="detailLedStrobeHzValue"
                        class="mx-auto mt-3 w-20 rounded border border-gray-700 bg-white/5 py-1.5 text-center text-xs text-green-300"
                    >
                        ${strobeHz} Hz
                    </div>
                </section>

                <button
                    type="button"
                    data-detail-reset-effects
                    class="w-full rounded-lg border border-gray-700 bg-white/5 px-4 py-4 text-sm text-gray-200 transition hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-300"
                >
                    ↻ Reset Effects
                </button>
            </div>
        </div>
    `;
}

function renderColorBlazeGradientEditor({
    segmentMode,
    colorA,
    colorB,
    direction,
    repeatMode,
    strobeHz
}) {
    const safeColorA = {
        r: Number(colorA?.r ?? 255),
        g: Number(colorA?.g ?? 128),
        b: Number(colorA?.b ?? 64)
    };

    const safeColorB = {
        r: Number(colorB?.r ?? 64),
        g: Number(colorB?.g ?? 128),
        b: Number(colorB?.b ?? 255)
    };

    const hexA = rgbToHex(
        safeColorA.r,
        safeColorA.g,
        safeColorA.b
    );

    const hexB = rgbToHex(
        safeColorB.r,
        safeColorB.g,
        safeColorB.b
    );

    const editingTarget =
        currentLedState.editingColorTarget === 'colorB'
            ? 'colorB'
            : 'colorA';

    const editingColor =
        editingTarget === 'colorB'
            ? safeColorB
            : safeColorA;

    const editingHex = rgbToHex(
        editingColor.r,
        editingColor.g,
        editingColor.b
    );

    return `
        <div class="detail-colorblaze-editor grid grid-cols-[minmax(0,1fr)_300px] gap-3">
            <div class="space-y-3">
                <div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                    <div class="text-xs text-blue-300">
                        Gradient mode creates a transition from Color A to Color B across the selected segments.
                    </div>
                </div>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs text-gray-300 mb-2">
                        Segment Mode
                    </div>

                    <div class="grid grid-cols-2 gap-1 rounded-lg border border-gray-700 p-1">
                        ${[4, 8].map(count => `
                            <button
                                type="button"
                                data-detail-led-segments="${count}"
                                class="h-9 rounded-md border text-xs transition ${
                                    segmentMode === count
                                        ? 'border-blue-500 bg-blue-500/30 text-blue-200'
                                        : 'border-transparent text-gray-300 hover:bg-white/5'
                                }"
                            >
                                ${count} Segments
                            </button>
                        `).join('')}
                    </div>
                </section>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs font-bold text-gray-200 mb-3">
                        GRADIENT EDITOR
                    </div>

                    <div class="detail-gradient-colors grid grid-cols-2 gap-3 mb-3">
                        <button
                            type="button"
                            data-detail-color-target="colorA"
                            class="rounded-lg border p-3 text-left transition ${
                                editingTarget === 'colorA'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 bg-white/5 hover:bg-white/10'
                            }"
                        >
                            <div class="text-[11px] text-gray-400 mb-2">
                                Color A · Start
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    id="detailColorAPreview"
                                    class="h-12 w-12 shrink-0 rounded-md border border-white/10"
                                    style="background:${hexA}"
                                ></div>

                                <div class="text-xs text-gray-300">
                                    ${hexA}
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            data-detail-color-target="colorB"
                            class="rounded-lg border p-3 text-left transition ${
                                editingTarget === 'colorB'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 bg-white/5 hover:bg-white/10'
                            }"
                        >
                            <div class="text-[11px] text-gray-400 mb-2">
                                Color B · End
                            </div>

                            <div class="flex items-center gap-3">
                                <div
                                    id="detailColorBPreview"
                                    class="h-12 w-12 shrink-0 rounded-md border border-white/10"
                                    style="background:${hexB}"
                                ></div>

                                <div class="text-xs text-gray-300">
                                    ${hexB}
                                </div>
                            </div>
                        </button>
                    </div>

                    <div class="mb-3">
                        <div class="text-[11px] text-gray-400 mb-2">
                            Gradient Preview
                        </div>

                        <div
                            id="detailGradientPreview"
                            class="h-14 rounded-lg border border-white/10"
                            style="background:linear-gradient(90deg, ${hexA}, ${hexB})"
                        ></div>
                    </div>

                    ${renderDetailRgbBlock(
                        editingColor.r,
                        editingColor.g,
                        editingColor.b,
                        editingHex
                    )}
                </section>
            </div>

            <div class="space-y-3">
                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-green-400 text-xs font-bold mb-3">
                        GRADIENT CONTROLS
                    </div>

                    <div class="text-xs text-gray-300 mb-2">
                        Direction
                    </div>

                    <div class="grid grid-cols-3 gap-1 rounded-lg border border-gray-700 p-1 mb-4">
                        ${[
                            ['forward', '→'],
                            ['reverse', '←'],
                            ['mirror', '↔']
                        ].map(([value, label]) => `
                            <button
                                type="button"
                                data-detail-led-direction="${value}"
                                class="h-9 rounded-md border text-sm transition ${
                                    direction === value
                                        ? 'border-green-500 bg-green-500/20 text-green-300'
                                        : 'border-transparent text-gray-300 hover:bg-white/5'
                                }"
                            >
                                ${label}
                            </button>
                        `).join('')}
                    </div>

                    <div class="text-xs text-gray-300 mb-2">
                        Repeat Mode
                    </div>

                    <div class="grid grid-cols-3 gap-1 rounded-lg border border-gray-700 p-1">
                        ${[
                            ['single', 'Single'],
                            ['repeat', 'Repeat'],
                            ['mirror', 'Mirror']
                        ].map(([value, label]) => `
                            <button
                                type="button"
                                data-detail-led-repeat-mode="${value}"
                                class="h-9 rounded-md border text-[11px] transition ${
                                    repeatMode === value
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                        : 'border-transparent text-gray-300 hover:bg-white/5'
                                }"
                            >
                                ${label}
                            </button>
                        `).join('')}
                    </div>
                </section>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
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
                        class="w-full accent-blue-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>0 Hz</span>
                        <span>20 Hz</span>
                    </div>

                    <div
                        id="detailLedStrobeHzValue"
                        class="mx-auto mt-3 w-20 rounded border border-gray-700 bg-white/5 py-1.5 text-center text-xs text-green-300"
                    >
                        ${strobeHz} Hz
                    </div>
                </section>

                <button
                    type="button"
                    data-detail-reset-effects
                    class="w-full rounded-lg border border-gray-700 bg-white/5 px-4 py-4 text-sm text-gray-200 transition hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-300"
                >
                    ↻ Reset Effects
                </button>
            </div>
        </div>
    `;
}

function renderColorBlazeChaseEditor({
    segmentMode,
    colorA,
    colorB,
    chaseSpeed,
    direction,
    strobeHz
}) {
    const safeColorA = {
        r: Number(colorA?.r ?? 255),
        g: Number(colorA?.g ?? 128),
        b: Number(colorA?.b ?? 64)
    };

    const safeColorB = {
        r: Number(colorB?.r ?? 64),
        g: Number(colorB?.g ?? 200),
        b: Number(colorB?.b ?? 255)
    };

    const hexA = rgbToHex(
        safeColorA.r,
        safeColorA.g,
        safeColorA.b
    );

    const hexB = rgbToHex(
        safeColorB.r,
        safeColorB.g,
        safeColorB.b
    );

    const editingTarget =
        currentLedState.editingColorTarget === 'colorB'
            ? 'colorB'
            : 'colorA';

    const editingColor =
        editingTarget === 'colorB'
            ? safeColorB
            : safeColorA;

    const editingHex = rgbToHex(
        editingColor.r,
        editingColor.g,
        editingColor.b
    );

    return `
        <div class="detail-colorblaze-editor grid grid-cols-[minmax(0,1fr)_300px] gap-3">
            <div class="space-y-3">
                <div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                    <div class="text-xs text-blue-300">
                        Chase mode animates Color 1 and Color 2 across the selected segments.
                    </div>
                </div>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs text-gray-300 mb-2">
                        Segment Mode
                    </div>

                    <div class="grid grid-cols-2 gap-1 rounded-lg border border-gray-700 p-1">
                        ${[4, 8].map(count => `
                            <button
                                type="button"
                                data-detail-led-segments="${count}"
                                class="h-9 rounded-md border text-xs transition ${
                                    segmentMode === count
                                        ? 'border-blue-500 bg-blue-500/30 text-blue-200'
                                        : 'border-transparent text-gray-300 hover:bg-white/5'
                                }"
                            >
                                ${count} Segments
                            </button>
                        `).join('')}
                    </div>
                </section>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs font-bold text-gray-200 mb-3">
                        COLOR CHASE
                    </div>

                    <div class="detail-chase-colors grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] gap-3 items-center mb-3">
                        <button
                            type="button"
                            data-detail-color-target="colorA"
                            class="rounded-lg border p-3 text-left transition ${
                                editingTarget === 'colorA'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 bg-white/5 hover:bg-white/10'
                            }"
                        >
                            <div class="text-[11px] text-gray-400 mb-2">
                                Color 1
                            </div>

                            <div
                                id="detailColorAPreview"
                                class="h-16 rounded-md border border-white/10"
                                style="background:${hexA}"
                            ></div>

                            <div class="mt-2 text-xs text-gray-300">
                                ${hexA}
                            </div>
                        </button>

                        <div class="detail-chase-arrow text-center text-2xl text-gray-300">
                            →
                        </div>

                        <button
                            type="button"
                            data-detail-color-target="colorB"
                            class="rounded-lg border p-3 text-left transition ${
                                editingTarget === 'colorB'
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-gray-700 bg-white/5 hover:bg-white/10'
                            }"
                        >
                            <div class="text-[11px] text-gray-400 mb-2">
                                Color 2
                            </div>

                            <div
                                id="detailColorBPreview"
                                class="h-16 rounded-md border border-white/10"
                                style="background:${hexB}"
                            ></div>

                            <div class="mt-2 text-xs text-gray-300">
                                ${hexB}
                            </div>
                        </button>
                    </div>

                    ${renderDetailRgbBlock(
                        editingColor.r,
                        editingColor.g,
                        editingColor.b,
                        editingHex
                    )}
                </section>
            </div>

            <div class="space-y-3">
                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-green-400 text-xs font-bold mb-3">
                        CHASE CONTROLS
                    </div>

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

                    <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>0.1x</span>
                        <span>1x</span>
                        <span>5x</span>
                    </div>

                    <div
                        id="detailLedChaseSpeedValue"
                        class="mx-auto mt-3 w-20 rounded border border-gray-700 bg-white/5 py-1.5 text-center text-xs text-green-300"
                    >
                        ${chaseSpeed}x
                    </div>

                    <div class="mt-4 text-xs text-gray-300 mb-2">
                        Direction
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        ${[
                            ['forward', 'Forward ▶'],
                            ['reverse', 'Reverse ◀']
                        ].map(([value, label]) => `
                            <button
                                type="button"
                                data-detail-led-direction="${value}"
                                class="h-10 rounded-md border text-xs transition ${
                                    direction === value
                                        ? 'border-green-500 bg-green-500/20 text-green-300'
                                        : 'border-gray-700 bg-white/5 text-gray-300 hover:bg-white/10'
                                }"
                            >
                                ${label}
                            </button>
                        `).join('')}
                    </div>
                </section>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
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
                        class="w-full accent-green-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>0 Hz</span>
                        <span>20 Hz</span>
                    </div>

                    <div
                        id="detailLedStrobeHzValue"
                        class="mx-auto mt-3 w-20 rounded border border-gray-700 bg-white/5 py-1.5 text-center text-xs text-green-300"
                    >
                        ${strobeHz} Hz
                    </div>
                </section>

                <button
                    type="button"
                    data-detail-reset-effects
                    class="w-full rounded-lg border border-gray-700 bg-white/5 px-4 py-4 text-sm text-gray-200 transition hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-300"
                >
                    ↻ Reset Effects
                </button>
            </div>
        </div>
    `;
}

function renderColorBlazeManualEditor({
    segmentMode,
    selectedSegment,
    segments,
    strobeHz
}) {
    const normalizedSegments = normalizeLedSegments(
        segments,
        segmentMode
    );

    const safeSelectedSegment = Math.max(
        0,
        Math.min(
            Number(selectedSegment ?? 0),
            normalizedSegments.length - 1
        )
    );

    const selectedColor =
        normalizedSegments[safeSelectedSegment] ?? {
            r: 255,
            g: 128,
            b: 64
        };

    const selectedHex = rgbToHex(
        selectedColor.r,
        selectedColor.g,
        selectedColor.b
    );

    return `
        <div class="detail-colorblaze-editor grid grid-cols-[minmax(0,1fr)_300px] gap-3">
            <div class="space-y-3">
                <div class="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                    <div class="text-xs text-blue-300">
                        Manual mode lets you assign a custom color to every segment.
                    </div>
                </div>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="text-xs text-gray-300 mb-2">
                        Segment Mode
                    </div>

                    <div class="grid grid-cols-2 gap-1 rounded-lg border border-gray-700 p-1">
                        ${[4, 8].map(count => `
                            <button
                                type="button"
                                data-detail-led-segments="${count}"
                                class="h-9 rounded-md border text-xs transition ${
                                    segmentMode === count
                                        ? 'border-blue-500 bg-blue-500/30 text-blue-200'
                                        : 'border-transparent text-gray-300 hover:bg-white/5'
                                }"
                            >
                                ${count} Segments
                            </button>
                        `).join('')}
                    </div>
                </section>

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-xs font-bold text-gray-200">
                            SELECTED SEGMENT
                        </div>

                        <div class="rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                            <span id="detailSelectedSegmentLabel">
                                ${String(safeSelectedSegment + 1).padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    ${renderDetailRgbBlock(
                        selectedColor.r,
                        selectedColor.g,
                        selectedColor.b,
                        selectedHex
                    )}
                </section>
            </div>

            <div class="space-y-3">
                ${renderDetailManualSegmentGrid(
                    normalizedSegments
                )}

                <section class="rounded-lg border border-gray-800 bg-black/20 p-3">
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
                        class="w-full accent-blue-500"
                    >

                    <div class="flex justify-between text-[11px] text-gray-500 mt-1">
                        <span>0 Hz</span>
                        <span>20 Hz</span>
                    </div>

                    <div
                        id="detailLedStrobeHzValue"
                        class="mx-auto mt-3 w-20 rounded border border-gray-700 bg-white/5 py-1.5 text-center text-xs text-green-300"
                    >
                        ${strobeHz} Hz
                    </div>
                </section>

                <button
                    type="button"
                    data-detail-reset-effects
                    class="w-full rounded-lg border border-gray-700 bg-white/5 px-4 py-4 text-sm text-gray-200 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                >
                    ↻ Reset Effects
                </button>
            </div>
        </div>
    `;
}

function normalizeLedSegments(segments, count) {
    const source =
        Array.isArray(segments)
            ? segments
            : [];

    const defaultColor = {
        r: 255,
        g: 128,
        b: 64
    };

    const fallback =
        source[source.length - 1] ??
        defaultColor;

    return Array.from(
        { length: count },
        (_, index) => {
            const color =
                source[index] ??
                fallback;

            return normalizeRgbColor255(
                color,
                defaultColor
            );
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
                    <span id="detailGridSelectedSegmentLabel">${String(selectedSegment + 1).padStart(2, '0')}</span>
                </div>
            </div>

            <div
                id="detailLedSegmentGrid"
                class="detail-manual-segment-grid grid grid-cols-4 gap-2"
            >
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

function updateColorBlazeDualColorPreviews() {
    const colorA = currentLedState.colorA ?? {
        r: 255,
        g: 128,
        b: 64
    };

    const colorB = currentLedState.colorB ?? {
        r: 64,
        g: 200,
        b: 255
    };

    const hexA = rgbToHex(
        colorA.r,
        colorA.g,
        colorA.b
    );

    const hexB = rgbToHex(
        colorB.r,
        colorB.g,
        colorB.b
    );

    const colorAPreview =
        getElement('detailColorAPreview');

    const colorBPreview =
        getElement('detailColorBPreview');

    const gradientPreview =
        getElement('detailGradientPreview');

    if (colorAPreview) {
        colorAPreview.style.background = hexA;
    }

    if (colorBPreview) {
        colorBPreview.style.background = hexB;
    }

    if (gradientPreview) {
        gradientPreview.style.background =
            `linear-gradient(90deg, ${hexA}, ${hexB})`;
    }
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

    const editorLabel =
        getElement('detailSelectedSegmentLabel');

    const gridLabel =
        getElement('detailGridSelectedSegmentLabel');

    const labelText = String(
        Number(currentLedState.selectedSegment ?? 0) + 1
    ).padStart(2, '0');

    if (editorLabel) {
        editorLabel.textContent = labelText;
    }

    if (gridLabel) {
        gridLabel.textContent = labelText;
    }
}

export function readColorBlazeValuesFromUI() {
    const panel =
        getElement('detailColorBlazePanel');

    if (!panel) {
        return {};
    }

    const ledMode =
        panel.dataset.ledMode ??
        currentLedState.ledMode ??
        'solid';

    const segmentMode = Number(
        panel.dataset.ledSegments ??
        currentLedState.segmentMode ??
        8
    );

    const state = {
        ledMode,
        segmentMode,

        selectedSegment: Number(
            currentLedState.selectedSegment ?? 0
        ),

        segments:
            currentLedState.segments.map(
                color => ({ ...color })
            ),

        colorA: {
            ...currentLedState.colorA
        },

        colorB: {
            ...currentLedState.colorB
        },

        chaseSpeed: Number(
            getElement(
                'detailLedChaseSpeedSlider'
            )?.value ??
            currentLedState.chaseSpeed ??
            1.5
        ),

        direction:
            panel.dataset.ledDirection ??
            currentLedState.direction ??
            'forward',

        repeatMode:
            panel.dataset.ledRepeatMode ??
            currentLedState.repeatMode ??
            'single',

        strobeHz: Number(
            getElement(
                'detailLedStrobeHzSlider'
            )?.value ??
            currentLedState.strobeHz ??
            0
        )
    };

    const detailR =
        getElement('detailRedSlider');

    const detailG =
        getElement('detailGreenSlider');

    const detailB =
        getElement('detailBlueSlider');

    if (
        detailR &&
        detailG &&
        detailB &&
        ledMode === 'solid'
    ) {
        state.r = Number(detailR.value);
        state.g = Number(detailG.value);
        state.b = Number(detailB.value);
    }

    if (ledMode === 'manual') {
        const selectedColor =
            currentLedState.segments[
                state.selectedSegment
            ];

        if (selectedColor) {
            state.r =
                Number(selectedColor.r);

            state.g =
                Number(selectedColor.g);

            state.b =
                Number(selectedColor.b);
        }
    }

    return state;
}

export function handleColorBlazeInput(
    target,
    onInput
) {
    if (!target) {
        return false;
    }

    const panel =
        getElement('detailColorBlazePanel');

    if (!panel) {
        return false;
    }

    if (
        target.id ===
        'detailLedStrobeHzSlider'
    ) {
        currentLedState.strobeHz =
            Number(target.value);

        const value =
            getElement(
                'detailLedStrobeHzValue'
            );

        if (value) {
            value.textContent =
                `${target.value} Hz`;
        }

        onInput();
        return true;
    }

    if (
        target.id ===
        'detailLedChaseSpeedSlider'
    ) {
        currentLedState.chaseSpeed =
            Number(target.value);

        const value =
            getElement(
                'detailLedChaseSpeedValue'
            );

        if (value) {
            value.textContent =
                `${target.value}x`;
        }

        onInput();
        return true;
    }

    const isColorInput =
        target.id === 'detailRedSlider' ||
        target.id === 'detailGreenSlider' ||
        target.id === 'detailBlueSlider';

    if (isColorInput) {
        const color = {
            r: Number(
                getElement(
                    'detailRedSlider'
                )?.value ?? 255
            ),

            g: Number(
                getElement(
                    'detailGreenSlider'
                )?.value ?? 128
            ),

            b: Number(
                getElement(
                    'detailBlueSlider'
                )?.value ?? 64
            )
        };

        const mode =
            currentLedState.ledMode;

        if (mode === 'manual') {
            const index =
                currentLedState.selectedSegment;

            currentLedState.segments[index] = {
                ...color
            };

            updateDetailManualSegmentSwatches();
        }

        if (mode === 'solid') {
            currentLedState.colorA = {
                ...color
            };

            currentLedState.segments =
                currentLedState.segments.map(
                    () => ({ ...color })
                );
        }

        if (
            mode === 'gradient' ||
            mode === 'chase'
        ) {
            if (
                currentLedState
                    .editingColorTarget ===
                'colorB'
            ) {
                currentLedState.colorB = {
                    ...color
                };
            } else {
                currentLedState.colorA = {
                    ...color
                };
            }

            updateColorBlazeDualColorPreviews();
        }

        return false;
    }

    return false;
}

export function handleColorBlazeClick(
    event,
    onInput
) {
    const modeButton =
        event.target.closest(
            '[data-detail-led-mode]'
        );

    if (modeButton) {
        const panel =
            getElement(
                'detailColorBlazePanel'
            );

        const nextMode =
            modeButton.dataset.detailLedMode;

        if (panel) {
            panel.dataset.ledMode =
                nextMode;
        }

        currentLedState.ledMode =
            nextMode;

        onInput({ render: true });
        return true;
    }

    const resetButton =
        event.target.closest(
            '[data-detail-reset-effects]'
        );

    if (resetButton) {
        currentLedState =
            createDefaultColorBlazeState();

        const panel =
            getElement('detailColorBlazePanel');

        if (panel) {
            panel.dataset.ledMode = 'solid';
            panel.dataset.ledSegments = '8';
            panel.dataset.ledDirection = 'forward';
            panel.dataset.ledRepeatMode = 'single';
        }

        const redSlider =
            getElement('detailRedSlider');

        const greenSlider =
            getElement('detailGreenSlider');

        const blueSlider =
            getElement('detailBlueSlider');

        const strobeSlider =
            getElement('detailLedStrobeHzSlider');

        const chaseSpeedSlider =
            getElement('detailLedChaseSpeedSlider');

        if (redSlider) {
            redSlider.value = '255';
        }

        if (greenSlider) {
            greenSlider.value = '128';
        }

        if (blueSlider) {
            blueSlider.value = '64';
        }

        if (strobeSlider) {
            strobeSlider.value = '0';
        }

        if (chaseSpeedSlider) {
            chaseSpeedSlider.value = '1.5';
        }

        onInput({ render: true });
        return true;
    }

    const colorTargetButton =
        event.target.closest(
            '[data-detail-color-target]'
        );

    if (colorTargetButton) {
        const target =
            colorTargetButton.dataset
                .detailColorTarget;

        currentLedState.editingColorTarget =
            target === 'colorB'
                ? 'colorB'
                : 'colorA';

        onInput({ render: true });
        return true;
    }

    const segmentModeButton =
        event.target.closest(
            '[data-detail-led-segments]'
        );

    if (segmentModeButton) {
        const nextSegmentMode = Number(
            segmentModeButton.dataset
                .detailLedSegments
        );

        if (
            nextSegmentMode !== 4 &&
            nextSegmentMode !== 8
        ) {
            return true;
        }

        currentLedState.segmentMode =
            nextSegmentMode;

        currentLedState.segments =
            normalizeLedSegments(
                currentLedState.segments,
                nextSegmentMode
            );

        if (
            currentLedState.selectedSegment >=
            nextSegmentMode
        ) {
            currentLedState.selectedSegment = 0;
        }

        const panel =
            getElement('detailColorBlazePanel');

        if (panel) {
            panel.dataset.ledSegments =
                String(nextSegmentMode);
        }

        onInput({ render: true });
        return true;
    }

    const segmentButton =
        event.target.closest(
            '[data-detail-led-segment]'
        );

    if (segmentButton) {
        const index = Number(
            segmentButton.dataset
                .detailLedSegment
        );

        currentLedState.selectedSegment =
            index;

        const color =
            currentLedState.segments[index] ??
            {
                r: 255,
                g: 128,
                b: 64
            };

        setDetailRgbValues(
            color.r,
            color.g,
            color.b
        );

        updateDetailManualSegmentSwatches();
        onInput();

        return true;
    }

    const directionButton =
        event.target.closest(
            '[data-detail-led-direction]'
        );

    if (directionButton) {
        const panel =
            getElement('detailColorBlazePanel');

        const nextDirection =
            directionButton.dataset
                .detailLedDirection;

        currentLedState.direction =
            nextDirection;

        if (panel) {
            panel.dataset.ledDirection =
                nextDirection;
        }

        onInput({ render: true });
        return true;
    }
    
    const repeatModeButton =
        event.target.closest(
            '[data-detail-led-repeat-mode]'
        );

    if (repeatModeButton) {
        const panel =
            getElement('detailColorBlazePanel');

        const nextRepeatMode =
            repeatModeButton.dataset
                .detailLedRepeatMode;

        currentLedState.repeatMode =
            nextRepeatMode;

        if (panel) {
            panel.dataset.ledRepeatMode =
                nextRepeatMode;
        }

        onInput({ render: true });
        return true;
    }

    return false;
}