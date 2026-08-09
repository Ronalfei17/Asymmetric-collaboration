const STORAGE_KEY = 'theatre-cue-list-v1';
const SCHEMA_VERSION = 2;

const INITIAL_CUES = [
    {
        id: 'cue-0',
        cueNumber: 0,
        name: 'Default',
        map: null,
        duration: 0,
        fixtures: {}
    },
    {
        id: 'cue-1',
        cueNumber: 1,
        name: 'Full Stage',
        map: null,
        duration: 0,
        fixtures: {}
    },
    {
        id: 'cue-2',
        cueNumber: 2,
        name: 'Warm Spotlight',
        map: null,
        duration: 0,
        fixtures: {}
    },
    {
        id: 'cue-3',
        cueNumber: 3,
        name: 'Blackout',
        map: null,
        duration: 0,
        fixtures: {}
    }
];

let initialized = false;
let state = createInitialState();
const listeners = new Set();

function createInitialState() {
    const now = Date.now();

    return {
        schemaVersion: SCHEMA_VERSION,
        cueList: {
            id: 'main',
            name: 'Main Cue List',
            cues: INITIAL_CUES.map(cue => ({
                ...deepClone(cue),
                createdAt: now,
                updatedAt: now
            }))
        },
        fixtureCueSavedAt: {},
        runtime: {
            editingCueId: null,
            appliedCueId: null
        }
    };
}

function deepClone(value) {
    if (value === undefined) return undefined;

    if (typeof globalThis.structuredClone === 'function') {
        return globalThis.structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function toFiniteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function normalizeFixtures(fixtures) {
    if (!fixtures || typeof fixtures !== 'object' || Array.isArray(fixtures)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(fixtures).map(([lightId, snapshot]) => [
            String(lightId),
            deepClone(snapshot)
        ])
    );
}

function normalizeCue(rawCue, index) {
    const now = Date.now();
    const cueNumber = toFiniteNumber(rawCue?.cueNumber, index);

    return {
        id: String(rawCue?.id || `cue-${cueNumber}`),
        cueNumber,
        name: String(rawCue?.name || `Default${cueNumber}`),
        map: rawCue?.map || null,
        duration: Math.max(0, toFiniteNumber(rawCue?.duration, 0)),
        fixtures: normalizeFixtures(rawCue?.fixtures),
        createdAt: toFiniteNumber(rawCue?.createdAt, now),
        updatedAt: toFiniteNumber(rawCue?.updatedAt, now)
    };
}

function buildFixtureCueSavedAtFromCues(cues) {
    const result = {};

    cues.forEach(cue => {
        const fallbackSavedAt = toFiniteNumber(
            cue.updatedAt,
            toFiniteNumber(cue.createdAt, Date.now())
        );

        Object.keys(cue.fixtures || {}).forEach(lightId => {
            const fixtureKey = String(lightId);

            if (!result[fixtureKey]) {
                result[fixtureKey] = {};
            }

            result[fixtureKey][String(cue.id)] = fallbackSavedAt;
        });
    });

    return result;
}

function normalizeFixtureCueSavedAt(rawValue, cues) {
    const fallback = buildFixtureCueSavedAtFromCues(cues);

    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        return fallback;
    }

    const cueById = new Map(cues.map(cue => [String(cue.id), cue]));
    const result = {};

    Object.entries(rawValue).forEach(([lightId, cueTimes]) => {
        if (!cueTimes || typeof cueTimes !== 'object' || Array.isArray(cueTimes)) {
            return;
        }

        const fixtureKey = String(lightId);

        Object.entries(cueTimes).forEach(([cueId, savedAt]) => {
            const cue = cueById.get(String(cueId));
            const fixtureExists = cue && Object.prototype.hasOwnProperty.call(
                cue.fixtures,
                fixtureKey
            );

            if (!fixtureExists) return;

            if (!result[fixtureKey]) {
                result[fixtureKey] = {};
            }

            result[fixtureKey][String(cueId)] = toFiniteNumber(
                savedAt,
                fallback[fixtureKey]?.[String(cueId)] || Date.now()
            );
        });
    });

    Object.entries(fallback).forEach(([lightId, cueTimes]) => {
        if (!result[lightId]) {
            result[lightId] = {};
        }

        Object.entries(cueTimes).forEach(([cueId, savedAt]) => {
            if (result[lightId][cueId] === undefined) {
                result[lightId][cueId] = savedAt;
            }
        });
    });

    return result;
}

function normalizePersistedState(rawValue) {
    const rawCueList = rawValue?.cueList || rawValue;

    const rawCues = Array.isArray(rawCueList?.cues)
        ? rawCueList.cues
        : null;

    if (!rawCues) return null;

    const cues = rawCues
        .map(normalizeCue)
        .sort((a, b) => a.cueNumber - b.cueNumber);

    return {
        schemaVersion: SCHEMA_VERSION,
        cueList: {
            id: String(rawCueList?.id || 'main'),
            name: String(rawCueList?.name || 'Main Cue List'),
            cues        
        },
        fixtureCueSavedAt: normalizeFixtureCueSavedAt(
            rawValue?.fixtureCueSavedAt,
            cues
        ),
        runtime: {
            editingCueId: null,
            appliedCueId: null
        }
    };
}

function readFromStorage() {
    try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
        if (!raw) return null;

        return normalizePersistedState(JSON.parse(raw));
    } catch (error) {
        console.warn('[CueStore] Failed to read saved cues:', error);
        return null;
    }
}

function persist() {
    try {
        const persistableState = {
            schemaVersion: SCHEMA_VERSION,
            cueList: state.cueList,
            fixtureCueSavedAt: state.fixtureCueSavedAt
        };

        globalThis.localStorage?.setItem(
            STORAGE_KEY,
            JSON.stringify(persistableState)
        );
    } catch (error) {
        console.warn('[CueStore] Failed to persist cues:', error);
    }
}

function emit(type, detail = {}) {
    const snapshot = getCueStoreSnapshot();
    const event = {
        type,
        detail: deepClone(detail)
    };

    listeners.forEach(listener => {
        try {
            listener(snapshot, event);
        } catch (error) {
            console.error('[CueStore] Listener failed:', error);
        }
    });
}

function ensureInitialized() {
    if (!initialized) {
        initializeCueStore();
    }
}

function findCueIndex(cueId) {
    return state.cueList.cues.findIndex(
        cue => cue.id === String(cueId)
    );
}

function getMutableCue(cueId) {
    const cueIndex = findCueIndex(cueId);

    return cueIndex >= 0
        ? state.cueList.cues[cueIndex]
        : null;
}

function markFixtureCueSaved(cueId, lightId, savedAt = Date.now()) {
    const fixtureKey = String(lightId);
    const normalizedCueId = String(cueId);

    if (!state.fixtureCueSavedAt[fixtureKey]) {
        state.fixtureCueSavedAt[fixtureKey] = {};
    }

    state.fixtureCueSavedAt[fixtureKey][normalizedCueId] = toFiniteNumber(
        savedAt,
        Date.now()
    );
}

function forgetFixtureCueSaved(
    cueId,
    lightId
) {
    const fixtureKey = String(lightId);
    const cueTimes =
        state.fixtureCueSavedAt[fixtureKey];

    if (!cueTimes) return;

    delete cueTimes[String(cueId)];

    if (Object.keys(cueTimes).length === 0) {
        delete state.fixtureCueSavedAt[
            fixtureKey
        ];
    }
}

export function initializeCueStore() {
    if (initialized) {
        return getCueStoreSnapshot();
    }

    state = readFromStorage() || createInitialState();
    initialized = true;
    persist();

    console.log('[CueStore] initialized', {
        cueCount: state.cueList.cues.length
    });

    return getCueStoreSnapshot();
}

export function getCueStoreSnapshot() {
    ensureInitialized();
    return deepClone(state);
}

export function getCues() {
    ensureInitialized();

    return deepClone(
        [...state.cueList.cues].sort(
            (a, b) => a.cueNumber - b.cueNumber
        )
    );
}

export function getCueById(cueId) {
    ensureInitialized();

    const cue = getMutableCue(cueId);

    return cue
        ? deepClone(cue)
        : null;
}

export function getNextCueNumber() {
    ensureInitialized();

    if (state.cueList.cues.length === 0) {
        return 0;
    }

    return Math.max(
        ...state.cueList.cues.map(cue => cue.cueNumber)
    ) + 1;
}

export function getEditingCueId() {
    ensureInitialized();
    return state.runtime.editingCueId;
}

export function setEditingCueId(cueId) {
    ensureInitialized();

    const normalizedCueId = cueId == null || cueId === ''
        ? null
        : String(cueId);

    if (normalizedCueId && !getMutableCue(normalizedCueId)) {
        throw new Error(`Cue not found: ${normalizedCueId}`);
    }

    if (state.runtime.editingCueId === normalizedCueId) {
        return normalizedCueId;
    }

    state.runtime.editingCueId = normalizedCueId;
    emit('editing-cue-changed', { cueId: normalizedCueId });

    return normalizedCueId;
}

export function getAppliedCueId() {
    ensureInitialized();
    return state.runtime.appliedCueId;
}

export function setAppliedCueId(cueId) {
    ensureInitialized();

    const normalizedCueId =
        cueId == null || cueId === ''
            ? null
            : String(cueId);

    if (
        normalizedCueId &&
        !getMutableCue(normalizedCueId)
    ) {
        throw new Error(
            `Cue not found: ${normalizedCueId}`
        );
    }

    if (
        state.runtime.appliedCueId ===
        normalizedCueId
    ) {
        return normalizedCueId;
    }

    state.runtime.appliedCueId =
        normalizedCueId;

    emit(
        'applied-cue-changed',
        {
            cueId:
                normalizedCueId
        }
    );

    return normalizedCueId;
}

export function createCue({
    name,
    lightId = null,
    fixtureSnapshot = null,
    map = null,
    duration = 0
} = {}) {
    ensureInitialized();

    const cueNumber = getNextCueNumber();
    const normalizedName =
        String(name || '').trim() || `Default${cueNumber}`;
    
    const now = Date.now();

    const cue = {
        id: `cue-${cueNumber}`,
        cueNumber,
        name: normalizedName,
        map: map || null,
        duration: Math.max(0, toFiniteNumber(duration, 0)),
        fixtures: {},
        createdAt: now,
        updatedAt: now
    };

    if (lightId != null && fixtureSnapshot) {
        cue.fixtures[String(lightId)] = deepClone(fixtureSnapshot);
    }

    state.cueList.cues.push(cue);

    if (lightId != null && fixtureSnapshot) {
        markFixtureCueSaved(cue.id, lightId, now);
    }

    state.cueList.cues.sort((a, b) => a.cueNumber - b.cueNumber);

    persist();
    emit('cue-created', { cueId: cue.id });

    return deepClone(cue);
}

export function renameCue(cueId, nextName) {
    ensureInitialized();

    const cue =
        getMutableCue(cueId);

    if (!cue) {
        throw new Error(
            `Cue not found: ${cueId}`
        );
    }

    // Cue 0 is the system baseline and cannot be renamed.
    if (Number(cue.cueNumber) === 0) {
        throw new Error(
            'Cue 0 cannot be renamed.'
        );
    }

    const normalizedName =
        String(nextName || '')
            .trim();

    if (!normalizedName) {
        throw new Error(
            'Cue name cannot be empty.'
        );
    }

    if (normalizedName.length > 40) {
        throw new Error(
            'Cue name must be 40 characters or fewer.'
        );
    }

    if (cue.name === normalizedName) {
        return deepClone(cue);
    }

    cue.name = normalizedName;

    persist();

    emit(
        'cue-renamed',
        {
            cueId: cue.id,
            cueNumber: cue.cueNumber,
            name: cue.name
        }
    );

    return deepClone(cue);
}

export function deleteCue(cueId) {
    ensureInitialized();

    const cueIndex =
        findCueIndex(cueId);

    if (cueIndex < 0) {
        return false;
    }

    const cue =
        state.cueList.cues[
            cueIndex
        ];

    // Cue 0 is the system baseline and must always exist.
    if (Number(cue.cueNumber) === 0) {
        throw new Error(
            'Cue 0 cannot be deleted.'
        );
    }

    const normalizedCueId =
        String(cue.id);

    Object.keys(
        state.fixtureCueSavedAt
    ).forEach(lightId => {
        forgetFixtureCueSaved(
            normalizedCueId,
            lightId
        );
    });

    state.cueList.cues.splice(
        cueIndex,
        1
    );

    if (
        String(
            state.runtime.editingCueId
        ) === normalizedCueId
    ) {
        state.runtime.editingCueId = null;
    }

    if (
        String(
            state.runtime.appliedCueId
        ) === normalizedCueId
    ) {
        state.runtime.appliedCueId = null;
    }

    persist();

    emit(
        'cue-deleted',
        {
            cueId: normalizedCueId,
            cueNumber: cue.cueNumber,
            name: cue.name
        }
    );

    return true;
}

export function getFixtureSnapshot(cueId, lightId) {
    ensureInitialized();

    const cue = getMutableCue(cueId);
    if (!cue) return null;

    const snapshot = cue.fixtures[String(lightId)];

    return snapshot
        ? deepClone(snapshot)
        : null;
}

export function upsertFixtureSnapshot(cueId, lightId, fixtureSnapshot) {
    ensureInitialized();

    const cue = getMutableCue(cueId);
    if (!cue) {
        throw new Error(`Cue not found: ${cueId}`);
    }

    if (lightId == null) {
        throw new Error('lightId is required');
    }

    if (!fixtureSnapshot || typeof fixtureSnapshot !== 'object') {
        throw new Error('fixtureSnapshot must be an object');
    }

    const savedAt = Date.now();
    cue.fixtures[String(lightId)] = deepClone(fixtureSnapshot);
    cue.updatedAt = savedAt;

    markFixtureCueSaved(cue.id, lightId, savedAt);

    persist();
    emit('fixture-snapshot-upserted', {
        cueId: cue.id,
        lightId: String(lightId)
    });

    return deepClone(cue.fixtures[String(lightId)]);
}

export function replaceCueFixtures(
    cueId,
    fixturesByLightId,
    {
        preserveSavedPriority = true
    } = {}
) {
    ensureInitialized();

    const cue = getMutableCue(cueId);

    if (!cue) {
        throw new Error(`Cue not found: ${cueId}`);
    }

    const nextFixtures =
        normalizeFixtures(fixturesByLightId);

    const previousFixtureKeys =
        Object.keys(cue.fixtures || {});

    const nextFixtureKeys =
        Object.keys(nextFixtures);

    const nextFixtureKeySet =
        new Set(nextFixtureKeys);

    const savedAt = Date.now();

    previousFixtureKeys.forEach(lightId => {
        if (!nextFixtureKeySet.has(lightId)) {
            forgetFixtureCueSaved(
                cue.id,
                lightId
            );
        }
    });

    cue.fixtures = nextFixtures;
    cue.updatedAt = savedAt;

    nextFixtureKeys.forEach(lightId => {
        const existingSavedAt =
            state.fixtureCueSavedAt[
                String(lightId)
            ]?.[String(cue.id)];

        if (
            !preserveSavedPriority ||
            existingSavedAt === undefined
        ) {
            markFixtureCueSaved(
                cue.id,
                lightId,
                savedAt
            );
        }
    });

    persist();

    emit('cue-fixtures-replaced', {
        cueId: cue.id,
        fixtureCount: nextFixtureKeys.length
    });

    return deepClone(cue);
}

export function removeFixtureFromCue(cueId, lightId) {
    ensureInitialized();

    const cue = getMutableCue(cueId);
    if (!cue) return false;

    const fixtureKey = String(lightId);
    if (!Object.prototype.hasOwnProperty.call(cue.fixtures, fixtureKey)) {
        return false;
    }

    delete cue.fixtures[fixtureKey];
    cue.updatedAt = Date.now();
    forgetFixtureCueSaved(cue.id, fixtureKey);

    persist();
    emit('fixture-removed-from-cue', {
        cueId: cue.id,
        lightId: fixtureKey
    });

    return true;
}

export function getCuesContainingFixture(lightId) {
    ensureInitialized();
    const fixtureKey = String(lightId);

    return deepClone(
        state.cueList.cues
            .filter(cue => (
                Object.prototype.hasOwnProperty.call(
                    cue.fixtures,
                    fixtureKey
                )
            ))
            .sort((a, b) => a.cueNumber - b.cueNumber)
    );
}

export function getLastSavedCueIdForFixture(lightId) {
    ensureInitialized();

    const fixtureKey = String(lightId);
    const cueTimes = state.fixtureCueSavedAt[fixtureKey] || {};

    const validEntries = Object.entries(cueTimes)
        .filter(([cueId]) => {
            const cue = getMutableCue(cueId);

            return cue && Object.prototype.hasOwnProperty.call(
                cue.fixtures,
                fixtureKey
            );
        })
        .sort((a, b) => Number(b[1]) - Number(a[1]));

    return validEntries[0]?.[0] || null;
}

export function getFixtureCountForCue(cueId) {
    ensureInitialized();

    const cue = getMutableCue(cueId);

    return cue
        ? Object.keys(cue.fixtures).length
        : 0;
}

export function subscribeCueStore(listener, { emitImmediately = false } = {}) {
    if (typeof listener !== 'function') {
        throw new TypeError('Cue store listener must be a function');
    }

    ensureInitialized();
    listeners.add(listener);

    if (emitImmediately) {
        listener(getCueStoreSnapshot(), {
            type: 'initial',
            detail: {}
        });
    }

    return () => {
        listeners.delete(listener);
    };
}

export function resetCueStoreForDevelopment() {
    state = createInitialState();
    initialized = true;
    persist();
    emit('store-reset');
}
