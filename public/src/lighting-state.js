// 用于保存每个 lightId 的状态
const fixtureStateMap = new Map();

function cloneState(state = {}) {
    const nextState = { ...state };

    if (Array.isArray(state.segments)) {
        nextState.segments = state.segments.map(color => ({ ...color }));
    }

    if (state.colorA && typeof state.colorA === 'object') {
        nextState.colorA = { ...state.colorA };
    }

    if (state.colorB && typeof state.colorB === 'object') {
        nextState.colorB = { ...state.colorB };
    }

    return nextState;
}

function safeNumber(value, fallback = 0) {
    if (value === null || value === undefined || value === '') return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function safeBoolean(value, fallback = false) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return fallback;
}

function normalizeColor255(value, fallback = 255) {
    const number = safeNumber(value, fallback);

    if (number >= 0 && number <= 1) {
        return Math.round(number * 255);
    }

    return Math.round(
        Math.max(0, Math.min(255, number))
    );
}

export function getFixtureState(fixture) {
    if (!fixture) return null;

    if (!fixtureStateMap.has(fixture.lightId)) {
        fixtureStateMap.set(
            fixture.lightId,
            cloneState(fixture.defaultState)
        );
    }

    return cloneState(
        fixtureStateMap.get(fixture.lightId)
    );
}

export function updateFixtureState(fixture, partialState = {}) {
    if (!fixture) return null;

    const defaultState = cloneState(fixture.defaultState || {});
    const currentState = getFixtureState(fixture) || defaultState;
    const nextPartialState = partialState && typeof partialState === 'object'? partialState: {};

    const nextState = cloneState({
        ...defaultState,
        ...currentState,
        ...nextPartialState
    });

    fixtureStateMap.set(
        fixture.lightId,
        nextState
    );

    return cloneState(nextState);
}

export function applyLightingStateSnapshot(snapshotItems = [], fixtures = []) {
    if (!Array.isArray(snapshotItems)) {
        console.warn(
            '[LightingState] Invalid lighting state snapshot:',
            snapshotItems
        );
        return 0;
    }

    const fixtureById = new Map(
        fixtures.map(fixture => [
            Number(fixture.lightId),
            fixture
        ])
    );

    let appliedCount = 0;

    snapshotItems.forEach(item => {
        const lightId = Number(item.lightId);

        if (!Number.isFinite(lightId)) {
            return;
        }

        const fixture = fixtureById.get(lightId);

        if (!fixture) {
            console.warn(
                '[LightingState] Unknown fixture in Unity snapshot:',
                lightId
            );

            return;
        }

        const defaultState = cloneState(fixture.defaultState || {});

        const currentState =
            fixtureStateMap.get(lightId) ||
            defaultState;

        const nextState = cloneState({
        ...defaultState,
        ...currentState,

        isOn: safeBoolean(
            item.isOn,
            currentState.isOn ?? defaultState.isOn ?? false
        ),

        intensity: safeNumber(
            item.intensity,
            currentState.intensity ?? defaultState.intensity ?? 0
        ),

        r: normalizeColor255(
            item.r,
            currentState.r ?? defaultState.r ?? 255
        ),

        g: normalizeColor255(
            item.g,
            currentState.g ?? defaultState.g ?? 255
        ),

        b: normalizeColor255(
            item.b,
            currentState.b ?? defaultState.b ?? 255
        ),

        fieldAngle: safeNumber(
            item.fieldAngle,
            currentState.fieldAngle ?? defaultState.fieldAngle ?? 30
        ),

        softness: safeNumber(
            item.softness,
            currentState.softness ?? defaultState.softness ?? 0.75
        ),

        pan: safeNumber(
            item.pan,
            currentState.pan ?? defaultState.pan ?? 0
        ),

        tilt: safeNumber(
            item.tilt,
            currentState.tilt ?? defaultState.tilt ?? 0
        ),

        strobeHz: safeNumber(
            item.strobeHz,
            currentState.strobeHz ?? defaultState.strobeHz ?? 0
        ),

        ledMode:
            item.ledMode ??
            currentState.ledMode ??
            defaultState.ledMode ??
            'solid',

        segmentMode: safeNumber(
            item.segmentMode,
            currentState.segmentMode ??
            defaultState.segmentMode ??
            8
        ),

        selectedSegment: safeNumber(
            item.selectedSegment,
            currentState.selectedSegment ??
            defaultState.selectedSegment ??
            0
        ),

        segments: Array.isArray(item.segments)
            ? item.segments.map(color => ({
                r: normalizeColor255(color?.r, 255),
                g: normalizeColor255(color?.g, 255),
                b: normalizeColor255(color?.b, 255)
            }))
            : (
                currentState.segments ??
                defaultState.segments ??
                []
            ),

        chaseSpeed: safeNumber(
            item.chaseSpeed,
            currentState.chaseSpeed ??
            defaultState.chaseSpeed ??
            1.5
        ),

        direction:
            item.direction ??
            currentState.direction ??
            defaultState.direction ??
            'forward',

        repeatMode:
            item.repeatMode ??
            currentState.repeatMode ??
            defaultState.repeatMode ??
            'single',

        colorA: item.colorA
            ? {
                r: normalizeColor255(item.colorA.r, 255),
                g: normalizeColor255(item.colorA.g, 128),
                b: normalizeColor255(item.colorA.b, 64)
            }
            : (
                currentState.colorA ??
                defaultState.colorA ??
                null
            ),

        colorB: item.colorB
            ? {
                r: normalizeColor255(item.colorB.r, 64),
                g: normalizeColor255(item.colorB.g, 128),
                b: normalizeColor255(item.colorB.b, 255)
            }
            : (
                currentState.colorB ??
                defaultState.colorB ??
                null
            )
    });

    fixtureStateMap.set(lightId, nextState);
        appliedCount += 1;
    });

    console.log(
        '[LightingState] Applied Unity lighting snapshot:',
        appliedCount
    );

    return appliedCount;
}

export function buildLightingPayload(fixture, state) {
    return {
        lightId: fixture.lightId,
        displayId: fixture.displayId,

        fixtureType: fixture.fixtureType,
        fixtureTypeLabel: fixture.fixtureTypeLabel,

        fixtureModel: fixture.fixtureModel,
        modelLabel: fixture.modelLabel,

        isOn: safeBoolean(state.isOn, false),
        intensity: safeNumber(state.intensity, 0),

        r: safeNumber(state.r, 255) / 255,
        g: safeNumber(state.g, 255) / 255,
        b: safeNumber(state.b, 255) / 255,

        fieldAngle: safeNumber(state.fieldAngle, 30),
        softness: safeNumber(state.softness, 0.75),

        pan: safeNumber(state.pan, 0),
        tilt: safeNumber(state.tilt, 0),

        ledMode: state.ledMode || 'solid',
        segmentMode: safeNumber(state.segmentMode, 8),
        selectedSegment: safeNumber(state.selectedSegment, 0),

        segments: Array.isArray(state.segments)
            ? state.segments.map(color => ({
                r: safeNumber(color.r, 255) / 255,
                g: safeNumber(color.g, 255) / 255,
                b: safeNumber(color.b, 255) / 255
            }))
            : [],

        colorA: state.colorA
            ? {
                r: safeNumber(state.colorA.r, 255) / 255,
                g: safeNumber(state.colorA.g, 128) / 255,
                b: safeNumber(state.colorA.b, 64) / 255
            }
            : null,

        colorB: state.colorB
            ? {
                r: safeNumber(state.colorB.r, 64) / 255,
                g: safeNumber(state.colorB.g, 128) / 255,
                b: safeNumber(state.colorB.b, 255) / 255
            }
            : null,

        chaseSpeed: safeNumber(state.chaseSpeed, 1.5),
        direction: state.direction || 'forward',
        repeatMode: state.repeatMode || 'single',
        strobeHz: safeNumber(state.strobeHz, 0)
    };
}