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

export const LIGHTING_MAP_LIGHT_ID = 32;

export const LIGHTING_MAP_MARKERS = [
    createMarker({
        markerId: 'selecon-rama-7-fresnel-32',
        lightId: 32,
        displayId: 'CH 32',
        fixtureType: 'fresnel',
        fixtureModel: 'SELECON_RAMA_7_FRESNEL',
        label: 'Selecon Rama 7" Fresnel - CH 32',
        x: 3726,
        y: 6008,
        width: 178,
        height: 97,
        rotation: 180,

        asset: './assets/selecon-rama-7-fresnel-32.png'
    })
];