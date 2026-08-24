function toHex(value) {
    return Math.round(
        clamp(Number(value), 0, 255)
    )
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
}

export function rgbToHex(r, g, b) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;

    if (delta !== 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
    }

    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    const v = max;

    return { h, s, v };
}

export function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

export function normalizeRgbChannel255(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    // Convert Unity's 0–1 range to the web UI's 0–255 range.
    if (number >= 0 && number <= 1) {
        return Math.round(number * 255);
    }

  // The value is already in the 0–255 range.
    return Math.round(
        clamp(number, 0, 255)
    );
}

export function normalizeRgbColor255(
    color,
    fallback = {
        r: 255,
        g: 128,
        b: 64
    }
) {
    return {
        r: normalizeRgbChannel255(
            color?.r,
            fallback.r
        ),

        g: normalizeRgbChannel255(
            color?.g,
            fallback.g
        ),

        b: normalizeRgbChannel255(
            color?.b,
            fallback.b
        )
    };
}
