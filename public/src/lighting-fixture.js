export const FIXTURE_TYPES = {
    PROFILE: 'profile',
    LED: 'led',
    FRESNEL: 'fresnel',
    MOVING: 'moving',
};

export const PROFILE_MODELS = {
    ETC_SOURCE4_ZOOM_15_30: 'ETC_SOURCE4_ZOOM_15_30',
    ETC_SOURCE4_JR_ZOOM_25_50: 'ETC_SOURCE4_JR_ZOOM_25_50',
    SELECON_SPX_15_35: 'SELECON_SPX_15_35',
    PRELUDE_16_30: 'PRELUDE_16_30',
    SELECON_ACCLAIM_CONDENSER_18_32: 'SELECON_ACCLAIM_CONDENSER_18_32',
    CANTATA_18_32: 'CANTATA_18_32'
};

export const LED_MODELS = {
    COLORBLAZE: 'COLORBLAZE',
    LUSTR_D60: 'LUSTR_D60',
    LUSTR_25_50: 'LUSTR_25_50',
    LUSTR2_36: 'LUSTR2_36',
    FLORRIE_TUBE: 'FLORRIE_TUBE'
};

export const FRESNEL_MODELS = {
    SELECON_RAMA_7_FRESNEL: 'SELECON_RAMA_7_FRESNEL',
    STRAND_CANTATA_F: 'STRAND_CANTATA_F',
    STARLETTE_FR: 'STARLETTE_FR'
};

export const MOVING_MODELS = {
    JB_A7: 'JB_A7',
    MARTIN_MAC_250: 'MARTIN_MAC_250'
};

export const FIXTURE_TYPE_LABELS = {
    [FIXTURE_TYPES.PROFILE]: 'Profile',
    [FIXTURE_TYPES.LED]: 'LED',
    [FIXTURE_TYPES.FRESNEL]: 'Fresnel',
    [FIXTURE_TYPES.MOVING]: 'Moving'
};

export const FIXTURE_MODEL_LABELS = {
    // Profile
    [PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30]: 'ETC Source 4 Zoom 15–30°',
    [PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50]: 'ETC Source 4 Jr Zoom 25–50°',
    [PROFILE_MODELS.SELECON_SPX_15_35]: 'Selecon SPX 15–35°',
    [PROFILE_MODELS.PRELUDE_16_30]: 'Prelude 16/30',
    [PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32]: 'Selecon Acclaim Condenser 18–32°',
    [PROFILE_MODELS.CANTATA_18_32]: 'Cantata 18/32',

    // LED
    [LED_MODELS.COLORBLAZE]: 'Color Kinetics ColorBlaze 48',
    [LED_MODELS.LUSTR_D60]: 'Lustr+ D60',
    [LED_MODELS.LUSTR_25_50]: 'Lustr+ 25–50°',
    [LED_MODELS.LUSTR2_36]: 'Lustr2+ 36°',
    [LED_MODELS.FLORRIE_TUBE]: 'Florrie Tube',

    // Fresnel
    [FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL]: 'Selecon Rama 7" Fresnel',
    [FRESNEL_MODELS.STRAND_CANTATA_F]: 'Strand Cantata F',
    [FRESNEL_MODELS.STARLETTE_FR]: 'Starlette Fr',

    // Moving Light
    [MOVING_MODELS.JB_A7]: 'JB A7',
    [MOVING_MODELS.MARTIN_MAC_250]: 'Martin MAC 250'
};

export const PROFILE_MODEL_PRESETS = {
    [PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30]: {
        fieldAngleMin: 15,
        fieldAngleMax: 30,
        defaultFieldAngle: 25
    },

    [PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50]: {
        fieldAngleMin: 25,
        fieldAngleMax: 50,
        defaultFieldAngle: 35
    },

    [PROFILE_MODELS.SELECON_SPX_15_35]: {
        fieldAngleMin: 15,
        fieldAngleMax: 35,
        defaultFieldAngle: 25
    },

    [PROFILE_MODELS.PRELUDE_16_30]: {
        fieldAngleMin: 16,
        fieldAngleMax: 30,
        defaultFieldAngle: 24
    },

    [PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32]: {
        fieldAngleMin: 18,
        fieldAngleMax: 32,
        defaultFieldAngle: 25
    },

    [PROFILE_MODELS.CANTATA_18_32]: {
        fieldAngleMin: 18,
        fieldAngleMax: 32,
        defaultFieldAngle: 25
    }
};

export const LED_MODEL_PRESETS = {
    [LED_MODELS.COLORBLAZE]: {
        fieldAngleMin: 10,
        fieldAngleMax: 10,
        defaultFieldAngle: 10,

        supportsRGB: true,
        supportsStrobe: true,

        supportsAdvancedModes: true,
        segmentModes: [4, 8],
        defaultSegmentMode: 8,

        modes: ['solid', 'gradient', 'chase', 'manual'],
        defaultMode: 'solid',

        defaultSolidColor: '#FF8040',
        defaultColorA: '#FF8040',
        defaultColorB: '#00D8FF',

        defaultDirection: 'forward',
        directionOptions: ['forward', 'reverse', 'mirror'],

        defaultRepeatMode: 'single',
        repeatModes: ['single', 'repeat', 'mirror'],

        defaultChaseSpeed: 1.5,

        defaultStrobeEnabled: false,
        defaultStrobeHz: 8,
        strobeHzMin: 0,
        strobeHzMax: 20,
        strobeHzStep: 0.5
    },

    [LED_MODELS.LUSTR_D60]: {
        fieldAngleMin: 17,
        fieldAngleMax: 17,
        defaultFieldAngle: 17,
        supportsRGB: true,
        supportsStrobe: true,
    },

    [LED_MODELS.LUSTR_25_50]: {
        fieldAngleMin: 25,
        fieldAngleMax: 50,
        defaultFieldAngle: 35,
        supportsRGB: true,
        supportsStrobe: true
    },

    [LED_MODELS.LUSTR2_36]: {
        fieldAngleMin: 36,
        fieldAngleMax: 36,
        defaultFieldAngle: 36,
        supportsRGB: true,
        supportsStrobe: true
    },

    [LED_MODELS.FLORRIE_TUBE]: {
        fieldAngleMin: 90,
        fieldAngleMax: 90,
        defaultFieldAngle: 90,
        supportsRGB: true,
        supportsStrobe: false,
    }
};

export const FRESNEL_MODEL_PRESETS = {
    [FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL]: {
        beamSizeMin: 7,
        beamSizeMax: 50,
        defaultBeamSize: 45,
        defaultSoftness: 0.8
    },
    [FRESNEL_MODELS.STRAND_CANTATA_F]: {
        beamSizeMin: 8.7,
        beamSizeMax: 50.7,
        defaultBeamSize: 45,
        defaultSoftness: 0.75
    },
    [FRESNEL_MODELS.STARLETTE_FR]: {
        beamSizeMin: 6,
        beamSizeMax: 57,
        defaultBeamSize: 40,
        defaultSoftness: 0.75
    }
};

export const MOVING_MODEL_PRESETS = {
    [MOVING_MODELS.JB_A7]: {
        panMin: -225,
        panMax: 225,
        tiltMin: -166,
        tiltMax: 166,
        defaultPan: 0,
        defaultTilt: 0
    },
    [MOVING_MODELS.MARTIN_MAC_250]: {
        panMin: -270,
        panMax: 270,
        tiltMin: -144.5,
        tiltMax: 144.5,
        defaultPan: 0,
        defaultTilt: 0
    }
};

function createDefaultState({
    intensity = 0.75,
    r = 255,
    g = 230,
    b = 200,
    fieldAngle = 30,
    beamSize = 45,
    softness = 0.75,
    pan = 0,
    tilt = 0,
    strobe = 0
} = {}) {
    return {
        isOn: true,
        intensity,
        r,
        g,
        b,
        fieldAngle,
        beamSize,
        softness,
        pan,
        tilt,
        strobe
    };
}

function createFixture({
    lightId,
    displayId = `CH ${lightId}`,
    label,
    fixtureType,
    fixtureModel,
    notes = '',
    defaultState = {}
}) {
    return {
        lightId,
        displayId,
        label,
        fixtureType,
        fixtureTypeLabel: FIXTURE_TYPE_LABELS[fixtureType],
        fixtureModel,
        modelLabel: FIXTURE_MODEL_LABELS[fixtureModel],
        notes,
        defaultState: createDefaultState(defaultState)
    };
}


export const FIXTURES = [
    // Profile - Selecon Acclaim Condenser 18–32° - lightId / channel: 7, 8, 9, 10, 11
    createFixture({
        lightId: 7,
        label: 'Selecon Acclaim Condenser 18–32° - CH 7',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 8,
        label: 'Selecon Acclaim Condenser 18–32° - CH 8',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 9,
        label: 'Selecon Acclaim Condenser 18–32° - CH 9',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 10,
        label: 'Selecon Acclaim Condenser 18–32° - CH 10',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 11,
        label: 'Selecon Acclaim Condenser 18–32° - CH 11',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),
    // Profile - Selecon SPX 15–35° - lightId / channel: 12, 13, 37
    createFixture({
        lightId: 12,
        label: 'Selecon SPX 15–35° - CH 12',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_SPX_15_35,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }), 
    createFixture({
        lightId: 13,
        label: 'Selecon SPX 15–35° - CH 13',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_SPX_15_35,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),
    createFixture({
        lightId: 37,
        label: 'Selecon SPX 15–35° - CH 37',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_SPX_15_35,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }), 
    // Profile - Prelude 16/30 - lightId / channel: 1, 2, 3, 4, 5, 6
    createFixture({
        lightId: 1,
        label: 'Prelude 16/30 - CH 1',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 2,
        label: 'Prelude 16/30 - CH 2',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 3,
        label: 'Prelude 16/30 - CH 3',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 4,
        label: 'Prelude 16/30 - CH 4',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 5,
        label: 'Prelude 16/30 - CH 5',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 6,
        label: 'Prelude 16/30 - CH 6',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),
    // Profile - ETC Source 4 Zoom 15–30° - lightId / channel: 48, 49, 50, 51
    createFixture({
        lightId: 48,
        label: 'ETC Source 4 Zoom 15–30° - CH 48',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 49,
        label: 'ETC Source 4 Zoom 15–30° - CH 49',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 50,
        label: 'ETC Source 4 Zoom 15–30° - CH 50',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 51,
        label: 'ETC Source 4 Zoom 15–30° - CH 51',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),
    // Profile - ETC Source 4 Jr Zoom 25–50° - lightId / channel: 14, 15, 16, 17, 18, 19, 34
    createFixture({
        lightId: 14,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 14',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 15,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 15',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 16,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 16',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 17,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 17',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 18,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 18',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 19,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 19',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 34,
        label: 'ETC Source 4 Jr Zoom 25–50° - CH 34',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),
    // Profile - Cantata 18/32 - lightId / channel: 30, 31, 41
    createFixture({
        lightId: 30,
        label: 'Cantata 18/32 - CH 30',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.CANTATA_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 31,
        label: 'Cantata 18/32 - CH 31',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.CANTATA_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 41,
        label: 'Cantata 18/32 - CH 41',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.CANTATA_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    // LED - Lustr2+ 36° - Light ID / Channel: 401, 402, 403, 404, 405, 406
    createFixture({
        lightId: 401,
        label: 'Lustr2+ 36° - CH 401',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 402,
        label: 'Lustr2+ 36° - CH 402',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 403,
        label: 'Lustr2+ 36° - CH 403',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 404,
        label: 'Lustr2+ 36° - CH 404',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 405,
        label: 'Lustr2+ 36° - CH 405',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 406,
        label: 'Lustr2+ 36° - CH 406',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR2_36,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 36,
            strobe: 0
        }
    }),
    // LED - Lustr+ 25–50° - Light ID / Channel: 407, 408, 409, 410, 411, 412
    createFixture({
        lightId: 407,
        label: 'Lustr+ 25–50° - CH 407',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 408,
        label: 'Lustr+ 25–50° - CH 408',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 409,
        label: 'Lustr+ 25–50° - CH 409',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 410,
        label: 'Lustr+ 25–50° - CH 410',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 411,
        label: 'Lustr+ 25–50° - CH 411',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 412,
        label: 'Lustr+ 25–50° - CH 412',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_25_50,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 35,
            strobe: 0
        }
    }),
    // LED - Lustr+ D60 - Light ID / Channel: 201, 202, 203, 204
    createFixture({
        lightId: 201,
        label: 'Lustr+ D60 - CH 201',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 17,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 202,
        label: 'Lustr+ D60 - CH 202',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 17,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 203,
        label: 'Lustr+ D60 - CH 203',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 17,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 204,
        label: 'Lustr+ D60 - CH 204',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 17,
            strobe: 0
        }
    }),
    // LED - Color Kinetics ColorBlaze 48 - Light ID / Channel: 117-124, 125-132, 133-140, 141-148, 149-156, 157-164, 101-108, 109-116
    createFixture({
        lightId: 117,
        displayId: 'CH 117-124',
        label: 'Color Kinetics ColorBlaze 48 - CH 117–124',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 125,
        displayId: 'CH 125-132',
        label: 'Color Kinetics ColorBlaze 48 - CH 125–132',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 133,
        displayId: 'CH 133-140',
        label: 'Color Kinetics ColorBlaze 48 - CH 133–140',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 141,
        displayId: 'CH 141-148',
        label: 'Color Kinetics ColorBlaze 48 - CH 141–148',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 149,
        displayId: 'CH 149-156',
        label: 'Color Kinetics ColorBlaze 48 - CH 149–156',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 157,
        displayId: 'CH 157-164',
        label: 'Color Kinetics ColorBlaze 48 - CH 157–164',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 101,
        displayId: 'CH 101-108',
        label: 'Color Kinetics ColorBlaze 48 - CH 101–108',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),

    createFixture({
        lightId: 109,
        displayId: 'CH 109-116',
        label: 'Color Kinetics ColorBlaze 48 - CH 109–116',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        notes: 'Range fixture. Starting channel is used as lightId.',
        defaultState: {
            isOn: true,
            intensity: 0.78,

            r: 255,
            g: 128,
            b: 64,

            fieldAngle: 36,

            ledMode: 'solid',

            colorA: {
                r: 255,
                g: 128,
                b: 64,
                hex: '#FF8040'
            },

            colorB: {
                r: 0,
                g: 216,
                b: 255,
                hex: '#00D8FF'
            },

            segmentMode: 8,
            selectedSegment: 1,

            direction: 'forward',
            repeatMode: 'single',

            chaseSpeed: 1.5,

            strobeEnabled: false,
            strobeHz: 8
        }
    }),
    // LED - Florrie Tube - Light ID / Channel: 27, 28, 29
    createFixture({
        lightId: 27,
        label: 'Florrie Tube - CH 27',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.FLORRIE_TUBE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 90,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 28,
        label: 'Florrie Tube - CH 28',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.FLORRIE_TUBE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 90,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 29,
        label: 'Florrie Tube - CH 29',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.FLORRIE_TUBE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 90,
            strobe: 0
        }
    }),
    // Fresnel - Selecon Rama 7" Fresnel - Light ID / Channel: 20, 22, 25, 26, 32, 33
    createFixture({
        lightId: 20,
        label: 'Selecon Rama 7" Fresnel - CH 20',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 22,
        label: 'Selecon Rama 7" Fresnel - CH 22',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 25,
        label: 'Selecon Rama 7" Fresnel - CH 25',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 26,
        label: 'Selecon Rama 7" Fresnel - CH 26',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 32,
        label: 'Selecon Rama 7" Fresnel - CH 32',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 33,
        label: 'Selecon Rama 7" Fresnel - CH 33',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),
    // Fresnel - Strand Cantata F - Light ID / Channel: 42, 43, 44, 45, 46, 47
    createFixture({
        lightId: 42,
        label: 'Strand Cantata F - CH 42',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 43,
        label: 'Strand Cantata F - CH 43',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 44,
        label: 'Strand Cantata F - CH 44',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 45,
        label: 'Strand Cantata F - CH 45',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 46,
        label: 'Strand Cantata F - CH 46',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 47,
        label: 'Strand Cantata F - CH 47',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STRAND_CANTATA_F,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.75
        }
    }),

    // Fresnel - Starlette Fr - Light ID / Channel: 35, 36
    createFixture({
        lightId: 35,
        label: 'Starlette Fr - CH 35',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STARLETTE_FR,
        defaultState: {
            intensity: 0.7,
            beamSize: 40,
            softness: 0.75
        }
    }),

    createFixture({
        lightId: 36,
        label: 'Starlette Fr - CH 36',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.STARLETTE_FR,
        defaultState: {
            intensity: 0.7,
            beamSize: 40,
            softness: 0.75
        }
    }),

    // Moving - JB A7 - Light ID / Channel: 301, 302
    createFixture({
        lightId: 301,
        label: 'JB A7 - CH 301',
        fixtureType: FIXTURE_TYPES.MOVING,
        fixtureModel: MOVING_MODELS.JB_A7,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 255,
            b: 255,
            pan: 0,
            tilt: 0
        }
    }),

    createFixture({
        lightId: 302,
        label: 'JB A7 - CH 302',
        fixtureType: FIXTURE_TYPES.MOVING,
        fixtureModel: MOVING_MODELS.JB_A7,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 255,
            b: 255,
            pan: 0,
            tilt: 0
        }
    }),
    // Moving - Martin MAC 250 - Light ID / Channel: 303, 304
    createFixture({
        lightId: 303,
        label: 'Martin MAC 250 - CH 303',
        fixtureType: FIXTURE_TYPES.MOVING,
        fixtureModel: MOVING_MODELS.MARTIN_MAC_250,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 255,
            b: 255,
            pan: 0,
            tilt: 0
        }
    }),

    createFixture({
        lightId: 304,
        label: 'Martin MAC 250 - CH 304',
        fixtureType: FIXTURE_TYPES.MOVING,
        fixtureModel: MOVING_MODELS.MARTIN_MAC_250,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 255,
            b: 255,
            pan: 0,
            tilt: 0
        }
    })
];

export function getFixtureTypes() {
    return [
        FIXTURE_TYPES.PROFILE,
        FIXTURE_TYPES.LED,
        FIXTURE_TYPES.FRESNEL,
        FIXTURE_TYPES.MOVING
    ];
}

export function getFixturesByType(fixtureType) {
    return FIXTURES.filter(fixture => fixture.fixtureType === fixtureType);
}

export function getFixtureById(lightId) {
    return FIXTURES.find(fixture => fixture.lightId === Number(lightId));
}

export function getFixturesByModel(fixtureModel) {
    return FIXTURES.filter(fixture => fixture.fixtureModel === fixtureModel);
}

export function getFixtureTypeLabel(fixtureType) {
    return FIXTURE_TYPE_LABELS[fixtureType] || fixtureType || '--';
}

export function getFixtureModelLabel(fixtureModel) {
    return FIXTURE_MODEL_LABELS[fixtureModel] || fixtureModel || '--';
}

export function getProfileModelPreset(profileModel) {
    return PROFILE_MODEL_PRESETS[profileModel] || null;
}

export function getLedModelPreset(ledModel) {
    return LED_MODEL_PRESETS[ledModel] || null;
}

export function getFresnelModelPreset(fresnelModel) {
    return FRESNEL_MODEL_PRESETS[fresnelModel] || null;
}

export function getMovingModelPreset(movingModel) {
    return MOVING_MODEL_PRESETS[movingModel] || null;
}