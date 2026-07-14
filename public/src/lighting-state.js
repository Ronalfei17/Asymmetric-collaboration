// 用于保存每个 lightId 的状态
const fixtureStateMap = new Map();

function cloneState(state) {
    return {
        ...state,
        segments: Array.isArray(state?.segments)
            ? state.segments.map(color => ({ ...color }))
            : undefined
    };
}

function safeNumber(value, fallback =0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

export function getFixtureState(fixture) {
    if (!fixture) return null;

    if (!fixtureStateMap.has(fixture.lightId)) {
        fixtureStateMap.set(fixture.lightId, cloneState(fixture.defaultState));
    }

    return fixtureStateMap.get(fixture.lightId);
}

export function updateFixtureState(fixture, partialState) {
    if (!fixture) return null;

    const currentState = getFixtureState(fixture);

    const nextState = {
        ...currentState,
        ...partialState
    };

    fixtureStateMap.set(fixture.lightId, nextState);

    return nextState;
};

export function buildLightingPayload(fixture, state) {
    return{
        lightId: fixture.lightId,
        displayId: fixture.displayId,

        fixtureType: fixture.fixtureType,
        fixtureTypeLabel: fixture.fixtureTypeLabel,

        fixtureModel: fixture.fixtureModel,
        modelLabel: fixture.modelLabel,

        isOn: Boolean(state.isOn),
        intensity: safeNumber(state.intensity, 0),

        r: safeNumber(state.r, 255) / 255,
        g: safeNumber(state.g, 255) / 255,
        b: safeNumber(state.b, 255) / 255,

        fieldAngle: safeNumber(state.fieldAngle, 30),

        beamSize: safeNumber(state.beamSize, 45),
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
        chaseSpeed: safeNumber(state.chaseSpeed, 1.5),
        direction: state.direction || 'forward',
        strobeHz: safeNumber(state.strobeHz, 0)
    };
}