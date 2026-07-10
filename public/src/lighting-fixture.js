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
    [LED_MODELS.COLORBLAZE]: 'Color Kinetics ColorBlaze',
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
        defaultFieldAngle: 60,
        supportsRGB: true,
        supportsStrobe: false
    },

    [LED_MODELS.LUSTR_D60]: {
        defaultFieldAngle: 60,
        supportsRGB: true,
        supportsStrobe: true
    },

    [LED_MODELS.LUSTR_25_50]: {
        defaultFieldAngle: 35,
        supportsRGB: true,
        supportsStrobe: true
    },

    [LED_MODELS.LUSTR2_36]: {
        defaultFieldAngle: 36,
        supportsRGB: true,
        supportsStrobe: true
    },

    [LED_MODELS.FLORRIE_TUBE]: {
        defaultFieldAngle: 90,
        supportsRGB: true,
        supportsStrobe: false
    }
};

export const FRESNEL_MODEL_PRESETS = {
    [FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL]: {
        defaultBeamSize: 45,
        defaultSoftness: 0.8
    },
    [FRESNEL_MODELS.STRAND_CANTATA_F]: {
        defaultBeamSize: 45,
        defaultSoftness: 0.75
    },
    [FRESNEL_MODELS.STARLETTE_FR]: {
        defaultBeamSize: 40,
        defaultSoftness: 0.75
    }
};

export const MOVING_MODEL_PRESETS = {
    [MOVING_MODELS.JB_A7]: {
        panMin: -270,
        panMax: 270,
        tiltMin: -144.5,
        tiltMax: 144.5,
        defaultPan: 0,
        defaultTilt: 0
    },
    [MOVING_MODELS.MARTIN_MAC_250]: {
        panMin: -270,
        panMax: 270,
        tiltMin: -135,
        tiltMax: 135,
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
    // Profile
    createFixture({
        lightId: 20,
        displayId: 'CH 20',
        label: 'Profile - Channel 20',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 21,
        displayId: 'CH 21',
        label: 'Profile - Channel 21',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 22,
        label: 'Profile - CH 22',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 23,
        label: 'Profile - CH 23',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 24,
        label: 'Profile - CH 24',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 25,
        label: 'Profile - CH 25',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 27,
        label: 'Profile - CH 27',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 28,
        label: 'Profile - CH 28',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 29,
        label: 'Profile - CH 29',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 30,
        label: 'Profile - CH 30',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 31,
        label: 'Profile - CH 31',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.PRELUDE_16_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 24
        }
    }),

    createFixture({
        lightId: 32,
        label: 'Profile - CH 32',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 33,
        label: 'Profile - CH 33',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 42,
        label: 'Profile - CH 42',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 43,
        label: 'Profile - CH 43',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_JR_ZOOM_25_50,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 35
        }
    }),

    createFixture({
        lightId: 44,
        label: 'Profile - CH 44',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 45,
        label: 'Profile - CH 45',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 46,
        label: 'Profile - CH 46',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 47,
        label: 'Profile - CH 47',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 52,
        label: 'Profile - CH 52',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 53,
        label: 'Profile - CH 53',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 54,
        label: 'Profile - CH 54',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.SELECON_ACCLAIM_CONDENSER_18_32,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 56,
        label: 'Profile - CH 56',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 64,
        label: 'Profile - CH 64',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),

    createFixture({
        lightId: 65,
        label: 'Profile - CH 65',
        fixtureType: FIXTURE_TYPES.PROFILE,
        fixtureModel: PROFILE_MODELS.ETC_SOURCE4_ZOOM_15_30,
        defaultState: {
            intensity: 0.75,
            fieldAngle: 25
        }
    }),
    // Led
    createFixture({
        lightId: 73,
        label: 'LED - CH 73',
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
        lightId: 88,
        label: 'LED - CH 88',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 96,
        label: 'LED - CH 96',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 99,
        label: 'LED - CH 99',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.LUSTR_D60,
        notes: 'Need to verify fixture model from clearer drawing.',
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 101,
        displayId: 'CH 101-108',
        label: 'ColorBlaze - CH 101–108',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 109,
        displayId: 'CH 109-116',
        label: 'ColorBlaze - CH 109–116',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 117,
        displayId: 'CH 117-124',
        label: 'ColorBlaze - CH 117–124',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 125,
        displayId: 'CH 125-132',
        label: 'ColorBlaze - CH 125–132',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 133,
        displayId: 'CH 133-140',
        label: 'ColorBlaze - CH 133–140',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 141,
        displayId: 'CH 141-148',
        label: 'ColorBlaze - CH 141–148',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 149,
        displayId: 'CH 149-156',
        label: 'ColorBlaze - CH 149–156',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),

    createFixture({
        lightId: 157,
        displayId: 'CH 157-164',
        label: 'ColorBlaze - CH 157–164',
        fixtureType: FIXTURE_TYPES.LED,
        fixtureModel: LED_MODELS.COLORBLAZE,
        defaultState: {
            intensity: 0.8,
            r: 255,
            g: 128,
            b: 64,
            fieldAngle: 60,
            strobe: 0
        }
    }),
    // Fresnel
    createFixture({
        lightId: 1,
        label: 'Fresnel - CH 1',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 2,
        label: 'Fresnel - CH 2',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 3,
        label: 'Fresnel - CH 3',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 4,
        label: 'Fresnel - CH 4',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 6,
        label: 'Fresnel - CH 6',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 7,
        label: 'Fresnel - CH 7',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 8,
        label: 'Fresnel - CH 8',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 10,
        label: 'Fresnel - CH 10',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 11,
        label: 'Fresnel - CH 11',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 12,
        label: 'Fresnel - CH 12',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),

    createFixture({
        lightId: 13,
        label: 'Fresnel - CH 13',
        fixtureType: FIXTURE_TYPES.FRESNEL,
        fixtureModel: FRESNEL_MODELS.SELECON_RAMA_7_FRESNEL,
        defaultState: {
            intensity: 0.7,
            beamSize: 45,
            softness: 0.8
        }
    }),
    // Moving
    createFixture({
        lightId: 301,
        label: 'Moving Light - CH 301',
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
        lightId: 302,
        label: 'Moving Light - CH 302',
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
        lightId: 303,
        label: 'Moving Light - CH 303',
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
        label: 'Moving Light - CH 304',
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
        lightId: 401,
        label: 'Moving Light - CH 401',
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
        lightId: 402,
        label: 'Moving Light - CH 402',
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
        lightId: 403,
        label: 'Moving Light - CH 403',
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
        lightId: 404,
        label: 'Moving Light - CH 404',
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
        lightId: 405,
        label: 'Moving Light - CH 405',
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
        lightId: 406,
        label: 'Moving Light - CH 406',
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