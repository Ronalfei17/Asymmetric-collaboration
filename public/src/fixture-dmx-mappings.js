export const FIXTURE_DMX_MAPPINGS = Object.freeze([
    Object.freeze({
        virtualLightId: 16,
        virtualLabel: 'CH 16',
        physicalLabel: 'Channel 8',
        gadgetPort: 1,
        startAddress: 94,
        endAddress: 94,
        attributes: Object.freeze({
            intensity: 94
        })
    })
]);

export function getDmxMappingByVirtualLightId(lightId) {
    const normalizedLightId = Number(lightId);

    return FIXTURE_DMX_MAPPINGS.find(mapping =>
        mapping.virtualLightId === normalizedLightId
    ) || null;
}

export function getDmxMappingByAddressRange(startAddress, endAddress, gadgetPort = 1) {
    const normalizedStart = Number(startAddress);
    const normalizedEnd = Number(endAddress);
    const normalizedPort = Number(gadgetPort);

    return FIXTURE_DMX_MAPPINGS.find(mapping =>
        mapping.gadgetPort === normalizedPort &&
        mapping.startAddress === normalizedStart &&
        mapping.endAddress === normalizedEnd
    ) || null;
}
