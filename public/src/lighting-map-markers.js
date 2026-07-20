const DESIGN_WIDTH = 10550;
const DESIGN_HEIGHT = 14900;

function createMarker({
    markerId,
    lightId,
    displayId,
    fixtureType,
    fixtureModel,
    label,
    x,
    y,
    width,
    height,
    rotation = 0,
    asset
}) {
    return {
        markerId,
        lightId,
        displayId,
        fixtureType,
        fixtureModel,
        label,

        sourceRect: {
            x,
            y,
            width,
            height,
            rotation
        },

        x: (x + width / 2) / DESIGN_WIDTH,
        y: (y + height / 2) / DESIGN_HEIGHT,

        width: width / DESIGN_WIDTH,
        height: height / DESIGN_HEIGHT,

        rotation,
        asset
    };
}

function createSeleconRama7FresnelMarker({
    lightId,
    x,
    y,
    width = 178,
    height = 97,
    rotation = 180,
    asset = './assets/selecon-rama-7-fresnel-32.png'
}) {
    return createMarker({
        markerId: `selecon-rama-7-fresnel-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'fresnel',
        fixtureModel: 'SELECON_RAMA_7_FRESNEL',
        label: `Selecon Rama 7" Fresnel - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createStrandCantataFMarker({
    lightId,
    x,
    y,
    width = 180,   
    height = 158,  
    rotation = 180,
    asset = './assets/Strand-Cantata-F.png'
}) {
    return createMarker({
        markerId: `strand-cantata-f-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'fresnel',
        fixtureModel: 'STRAND_CANTATA_F',
        label: `Strand Cantata F - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createStarletteFrMarker({
    lightId,
    x,
    y,
    width = 182,
    height = 167,
    rotation = 180,
    asset = './assets/Starlette-Fr.png'
}) {
    return createMarker({
        markerId: `starlette-fr-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'fresnel',
        fixtureModel: 'STARLETTE_FR',
        label: `Starlette Fr - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createMartinMac250Marker({
    lightId,
    x,
    y,
    width = 221,
    height = 231,
    rotation = 180,
    asset = './assets/Martin-MAC-250.png'
}) {
    return createMarker({
        markerId: `martin-mac-250-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'moving',
        fixtureModel: 'MARTIN_MAC_250',
        label: `Martin MAC 250 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createJbA7Marker({
    lightId,
    x,
    y,
    width = 261,
    height = 263,
    rotation = 180,
    asset = './assets/JB-A7.png'
}) {
    return createMarker({
        markerId: `jb-a7-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'moving',
        fixtureModel: 'JB_A7',
        label: `JB A7 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createLustrD60Marker({
    lightId,
    x,
    y,
    width = 193,
    height = 195,
    rotation = 180,
    asset = './assets/Lustr-D60.png'
}) {
    return createMarker({
        markerId: `lustr-d60-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'led',
        fixtureModel: 'LUSTR_D60',
        label: `Lustr+ D60 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createLustr25To50Marker({
    lightId,
    x,
    y,
    width = 399,
    height = 108,
    rotation = 180,
    asset = './assets/Lustr-25-50.png'
}) {
    return createMarker({
        markerId: `lustr-25-50-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'led',
        fixtureModel: 'LUSTR_25_50',
        label: `Lustr+ 25-50° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createLustr2_36Marker({
    lightId,
    x,
    y,
    width = 115,
    height = 395,
    rotation = 180,
    asset = './assets/Lustr2-36.png'
}) {
    return createMarker({
        markerId: `lustr2-36-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'led',
        fixtureModel: 'LUSTR2_36',
        label: `Lustr2+ 36° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createColorBlaze48Marker({
    lightId,
    displayId,
    x,
    y,
    width = 522,
    height = 64,
    rotation = 180,
    asset = './assets/Color-Kinetics-Colorblaze-48.png'
}) {
    const safeDisplayId = displayId || `CH ${lightId}`;

    return createMarker({
        markerId: `colorblaze-48-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'led',
        fixtureModel: 'COLORBLAZE',
        label: `ColorBlaze 48 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createFlorrieTubeMarker({
    lightId,
    displayId,
    x,
    y,
    width = 568,
    height = 38,
    rotation = 180,
    asset = './assets/Florrie-Tube.png'
}) {
    const safeDisplayId = displayId || `CH ${lightId}`;
    
    return createMarker({
        markerId: `florrie-tube-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'led',
        fixtureModel: 'FLORRIE_TUBE',
        label: `Florrie Tube - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createEtcSource4Zoom1530Marker({
    lightId,
    x,
    y,
    width = 410,
    height = 152,
    rotation = 180,
    asset = './assets/ETC-Source-4-Zoom-15-30.png'
}) {
    return createMarker({
        markerId: `etc-source-4-zoom-15-30-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'ETC_SOURCE4_ZOOM_15_30',
        label: `ETC Source 4 Zoom 15-30° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createEtcSource4JrZoom2550Marker({
    lightId,
    x,
    y,
    width = 129.03, 
    height = 372.28,  
    rotation = 0,
    asset = './assets/ETC-Source-4-Jr-Zoom-25-50.png'
}) {
    return createMarker({
        markerId: `etc-source-4-jr-zoom-25-50-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'ETC_SOURCE4_JR_ZOOM_25_50',
        label: `ETC Source 4 Jr Zoom 25-50° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createSeleconSpx1535Marker({
    lightId,
    x,
    y,
    width = 90,
    height = 340,
    rotation = 180,
    asset = './assets/Selecon-SPX-15-35.png'
}) {
    return createMarker({
        markerId: `selecon-spx-15-35-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'SELECON_SPX_15_35',
        label: `Selecon SPX 15-35° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createPrelude1630Marker({
    lightId,
    x,
    y,
    width = 166,
    height = 309,
    rotation = 180,
    asset = './assets/Prelude-16-30.png'
}) {
    return createMarker({
        markerId: `prelude-16-30-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'PRELUDE_16_30',
        label: `Prelude 16/30 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createSeleconAcclaimCondenser1832Marker({
    lightId,
    x,
    y,
    width = 101,
    height = 267,
    rotation = 180,
    asset = './assets/Selecon-Acclaim-Condenser-18-32.png'
}) {
    return createMarker({
        markerId: `selecon-acclaim-condenser-18-32-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'SELECON_ACCLAIM_CONDENSER_18_32',
        label: `Selecon Acclaim Condenser 18-32° - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

function createCantata1832Marker({
    lightId,
    x,
    y,
    width = 124,
    height = 354,
    rotation = 180,
    asset = './assets/Cantata-18-32.png'
}) {
    return createMarker({
        markerId: `cantata-18-32-${lightId}`,
        lightId,
        displayId: `CH ${lightId}`,
        fixtureType: 'profile',
        fixtureModel: 'CANTATA_18_32',
        label: `Cantata 18/32 - CH ${lightId}`,
        x,
        y,
        width,
        height,
        rotation,
        asset
    });
}

export const LIGHTING_MAP_MARKERS = [
    createSeleconRama7FresnelMarker({
        lightId: 32,
        x: 3548,
        y: 5911,
        rotation: 180
    }),

    createSeleconRama7FresnelMarker({
        lightId: 20,
        x: 5660,
        y: 5867,
        rotation: 90
    }),

    createSeleconRama7FresnelMarker({
        lightId: 22,
        x: 6994,
        y: 5867,
        rotation: 90
    }),

    createSeleconRama7FresnelMarker({
        lightId: 33,
        x: 8586,
        y: 5926,
        rotation: 180
    }),

    createSeleconRama7FresnelMarker({
        lightId: 25,
        x: 7423,
        y: 3436,
        rotation: 180
    }),

    createSeleconRama7FresnelMarker({
        lightId: 26,
        x: 4638,
        y: 3620,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 42,
        x: 4737,
        y: 8257,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 43,
        x: 5829,
        y: 8257,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 44,
        x: 6969,
        y: 8257,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 45,
        x: 4741,
        y: 6317,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 46,
        x: 6123,
        y: 6317,
        rotation: 180
    }),

    createStrandCantataFMarker({
        lightId: 47,
        x: 6954,
        y: 6317,
        rotation: 180
    }),

    createStarletteFrMarker({
        lightId: 35,
        x: 4159,
        y: 7242,
        rotation: 0
    }),

    createStarletteFrMarker({
        lightId: 36,
        x: 8043,
        y: 7242,
        rotation: 180
    }),

    createMartinMac250Marker({
        lightId: 303,
        x: 5177,
        y: 5329,
        rotation: 180
    }),

    createMartinMac250Marker({
        lightId: 304,
        x: 7144,
        y: 5329,
        rotation: 180
    }),

    createJbA7Marker({
        lightId: 301,
        x: 4929,
        y: 6310,
        rotation: 0
    }),

    createJbA7Marker({
        lightId: 302,
        x: 7579,
        y: 6310,
        rotation: 0
    }),

    createLustrD60Marker({
        lightId: 201,
        x: 5419,
        y: 4122,
        rotation: 0
    }),

    createLustrD60Marker({
        lightId: 202,
        x: 6977,
        y: 4124,
        rotation: 0
    }),

    createLustrD60Marker({
        lightId: 203,
        x: 5434,
        y: 5335,
        rotation: 0
    }),

    createLustrD60Marker({
        lightId: 204,
        x: 6928,
        y: 5335,
        rotation: 0
    }),

    createLustr2_36Marker({
        lightId: 401,
        x: 5254,
        y: 6264,
        rotation: 180
    }),

    createLustr2_36Marker({
        lightId: 402,
        x: 7206,
        y: 6264,
        rotation: 180
    }),

    createLustr2_36Marker({
        lightId: 403,
        x: 6429,
        y: 8106,
        rotation: 180
    }),

    createLustr2_36Marker({
        lightId: 404,
        x: 7154,
        y: 8106,
        rotation: 180
    }),

    createLustr2_36Marker({
        lightId: 405,
        x: 6264,
        y: 6913,
        rotation: 180
    }),

    createLustr2_36Marker({
        lightId: 406,
        x: 6264,
        y: 5744,
        rotation: 180
    }),

    createLustr25To50Marker({
        lightId: 407,
        x: 8336,
        y: 4931,
        rotation: 180
    }),

    createLustr25To50Marker({
        lightId: 408,
        x: 3531,
        y: 4931,
        rotation: 0
    }),

    createLustr25To50Marker({
        lightId: 409,
        x: 7937,
        y: 5910,
        rotation: 180
    }),

    createLustr25To50Marker({
        lightId: 410,
        x: 3982,
        y: 5910,
        rotation: 0
    }),

    createLustr25To50Marker({
        lightId: 411,
        x: 7950,
        y: 6939,
        rotation: -165
    }),

    createLustr25To50Marker({
        lightId: 412,
        x: 4000,
        y: 6951,
        rotation: -15
    }),

    createColorBlaze48Marker({
        lightId: 101,
        displayId: 'CH 101-108',
        x: 5701,
        y: 4217,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 109,
        displayId: 'CH 109-116',
        x: 6347,
        y: 4217,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 117,
        displayId: 'CH 117-124',
        x: 4323,
        y: 4943,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 125,
        displayId: 'CH 125-132',
        x: 4993,
        y: 4943,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 133,
        displayId: 'CH 133-140',
        x: 5649,
        y: 4943,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 141,
        displayId: 'CH 141-148',
        x: 6322,
        y: 4943,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 149,
        displayId: 'CH 149-156',
        x: 6977,
        y: 4943,
        rotation: 0
    }),

    createColorBlaze48Marker({
        lightId: 157,
        displayId: 'CH 157-164',
        x: 7615,
        y: 4943,
        rotation: 0
    }),

    createFlorrieTubeMarker({
        lightId: 27,
        x: 5232,
        y: 4360,
        rotation: 0
    }),

    createFlorrieTubeMarker({
        lightId: 28,
        x: 5940,
        y: 4360,
        rotation: 0
    }),

    createFlorrieTubeMarker({
        lightId: 29,
        x: 6698,
        y: 4360,
        rotation: 0
    }),

    createPrelude1630Marker({
        lightId: 1,
        x: 5844,
        y: 5305,
        rotation: 180
    }),

    createPrelude1630Marker({
        lightId: 2,
        x: 7817,
        y: 7314,
        rotation: 180
    }),

    createPrelude1630Marker({
        lightId: 3,
        x: 6264,
        y: 5310,
        rotation: 180
    }),

    createPrelude1630Marker({
        lightId: 4,
        x: 7321,
        y:73140,
        rotation: 180
    }),

    createPrelude1630Marker({
        lightId: 5,
        x: 4679,
        y: 7314,
        rotation: 180
    }),

    createPrelude1630Marker({
        lightId: 6,
        x: 5109,
        y: 7319,
        rotation: 180
    }),

    createSeleconAcclaimCondenser1832Marker({
        lightId: 7,
        x: 6891,
        y: 7035,
        rotation: 180
    }),

    createSeleconAcclaimCondenser1832Marker({
        lightId: 8,
        x: 5335,
        y: 7035,
        rotation: 180
    }),

    createSeleconAcclaimCondenser1832Marker({
        lightId: 9,
        x: 7423,
        y: 6312,
        rotation: 180
    }),

    createSeleconAcclaimCondenser1832Marker({
        lightId: 10,
        x: 5640,
        y: 6306,
        rotation: 180
    }),

    createSeleconAcclaimCondenser1832Marker({
        lightId: 11,
        x: 6699,
        y: 5342,
        rotation: 180
    }),

    createSeleconSpx1535Marker({
        lightId: 12,
        x: 4755,
        y: 5262,
        rotation: 0
    }),

    createSeleconSpx1535Marker({
        lightId: 13,
        x: 7610,
        y: 5262,
        rotation: 0
    }),

    createSeleconSpx1535Marker({
        lightId: 37,
        x: 6425,
        y: 2958,
        rotation: 190
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 14,
        x: 4500,
        y: 5713,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 15,
        x: 4500,
        y: 6266,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 16,
        x: 4500,
        y: 6990,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 17,
        x: 5900,
        y: 5726,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 18,
        x: 5900,
        y: 6281,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 19,
        x: 5900,
        y: 7003,
        rotation: 30
    }),

    createEtcSource4JrZoom2550Marker({
        lightId: 34,
        x: 7480,
        y: 8111,
        rotation: -30
    }),

    createCantata1832Marker({
        lightId: 30,
        x: 4891,
        y: 5746,
        rotation: 0
    }),

    createCantata1832Marker({
        lightId: 31,
        x: 7693,
        y: 5746,
        rotation: 0
    }),

    createCantata1832Marker({
        lightId: 41,
        x: 6223,
        y: 4886,
        rotation: 180
    }),

    createEtcSource4Zoom1530Marker({
        lightId: 48,
        x: 4711,
        y: 4163,
        rotation: 180
    }),

    createEtcSource4Zoom1530Marker({
        lightId: 49,
        x: 7380,
        y: 4163,
        rotation: 0
    }),

    createEtcSource4Zoom1530Marker({
        lightId: 50,
        x: 2760,
        y: 4464,
        rotation: 180
    }),

    createEtcSource4Zoom1530Marker({
        lightId: 51,
        x: 9021,
        y: 4498,
        rotation: 0
    })
];