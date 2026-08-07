import {
    FIXTURE_TYPES,
    getProfileModelPreset,
    getLedModelPreset,
    getFresnelModelPreset,
    getMovingModelPreset
} from './lighting-fixture.js';

export function getElement(id) {
    return document.getElementById(id);
}

export function toBoolean(value, fallback = true) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return fallback;
}

export function isAdvancedLedFixture(fixture) {
    const preset = getLedModelPreset(fixture?.fixtureModel);

    return fixture?.fixtureType === FIXTURE_TYPES.LED &&
           Boolean(preset?.supportsAdvancedModes);
}

export function getFixturePreset(fixture) {
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

export function getAngleConfig(fixture) {
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

export function sanitizeAngleForFixture(fixture, rawAngle) {
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

export function formatAngle(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';

    return Number.isInteger(number)
        ? String(number)
        : number.toFixed(1);
}

export function formatPanTilt(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '--';
    }

    return String(
        Math.round(number)
    );
}