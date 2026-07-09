export function setupLightingControl(sendControlMessage) {
    const powerToggle = document.getElementById('powerToggle');
    const powerKnob = document.getElementById('powerKnob');
    const powerLamp = document.getElementById('powerLamp');

    const intensitySlider = document.getElementById('intensitySlider');
    const intensityValue = document.getElementById('intensityValue');

    const redSlider = document.getElementById('redSlider');
    const greenSlider = document.getElementById('greenSlider');
    const blueSlider = document.getElementById('blueSlider');

    const redValue = document.getElementById('redValue');
    const greenValue = document.getElementById('greenValue');
    const blueValue = document.getElementById('blueValue');
    const hexValue = document.getElementById('hexValue');
    const colorPreview = document.getElementById('colorPreview');

    const colorWheel = document.getElementById('colorWheel');
    const colorWheelMarker = document.getElementById('colorWheelMarker');

    const panSlider = document.getElementById('panSlider');
    const tiltSlider = document.getElementById('tiltSlider');
    const panValue = document.getElementById('panValue');
    const tiltValue = document.getElementById('tiltValue');
    const resetAnglesBtn = document.getElementById('resetAnglesBtn');

    let selectedLightId = 1;

    function sendMovingLightState() {
        sendControlMessage('moving-light', {
            lightId: selectedLightId,
            isOn: powerToggle ? powerToggle.dataset.on === 'true' : true,
            intensity: intensitySlider ? Number(intensitySlider.value) / 100 : 0,
            pan: panSlider ? Number(panSlider.value) : 0,
            tilt: tiltSlider ? Number(tiltSlider.value) : 0,
            r: redSlider ? Number(redSlider.value) / 255 : 1,
            g: greenSlider ? Number(greenSlider.value) / 255 : 1,
            b: blueSlider ? Number(blueSlider.value) / 255 : 1
        });
    }

    function toHex(value) {
        return Number(value).toString(16).padStart(2, '0').toUpperCase();
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function rgbToHsv(r, g, b) {
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

    function hsvToRgb(h, s, v) {
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

    function updateWheelMarkerFromRGB() {
        if (!colorWheelMarker) return;

        const r = Number(redSlider.value);
        const g = Number(greenSlider.value);
        const b = Number(blueSlider.value);
        const { h, s } = rgbToHsv(r, g, b);

        const angle = (h - 90) * Math.PI / 180;
        const radius = 22 * clamp(s, 0.25, 1);

        const x = 28 + Math.cos(angle) * radius;
        const y = 28 + Math.sin(angle) * radius;

        colorWheelMarker.style.left = `${x}px`;
        colorWheelMarker.style.top = `${y}px`;
    }

    function updateRGB() {
        if (!redSlider || !greenSlider || !blueSlider) return;

        const r = redSlider.value;
        const g = greenSlider.value;
        const b = blueSlider.value;
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        redValue.innerText = r;
        greenValue.innerText = g;
        blueValue.innerText = b;
        hexValue.innerText = hex;

        if (colorPreview) {
            colorPreview.style.backgroundColor = hex;
            colorPreview.style.boxShadow = `0 0 12px ${hex}66`;
        }

        updateWheelMarkerFromRGB();
    }

    function updateRGBFromWheel(event) {
        if (!colorWheel || !redSlider || !greenSlider || !blueSlider) return;

        const rect = colorWheel.getBoundingClientRect();
        const point = event.touches ? event.touches[0] : event;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = point.clientX - centerX;
        const dy = point.clientY - centerY;

        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = rect.width / 2;

        const hue = (angle * 180 / Math.PI + 90 + 360) % 360;
        const saturation = clamp(distance / radius, 0, 1);

        const current = rgbToHsv(
            Number(redSlider.value),
            Number(greenSlider.value),
            Number(blueSlider.value)
        );

        const rgb = hsvToRgb(hue, saturation, current.v || 1);

        redSlider.value = rgb.r;
        greenSlider.value = rgb.g;
        blueSlider.value = rgb.b;

        updateRGB();
    }

    function setPowerState(isOn) {
        if (!powerToggle || !powerKnob) return;

        powerToggle.dataset.on = String(isOn);

        if (isOn) {
            powerToggle.className = "w-14 h-8 rounded-full bg-green-500 relative shadow-[0_0_14px_rgba(34,197,94,0.35)] transition-all";
            powerKnob.className = "absolute right-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-all";

            if (powerLamp) {
                powerLamp.className = "w-12 h-12 rounded-full bg-green-500/15 border border-green-400/30 flex items-center justify-center text-green-300 transition-all shadow-[0_0_18px_rgba(34,197,94,0.2)]";
            }
        } else {
            powerToggle.className = "w-14 h-8 rounded-full bg-gray-700 relative shadow-none transition-all";
            powerKnob.className = "absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-all";

            if (powerLamp) {
                powerLamp.className = "w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center text-gray-500 transition-all";
            }
        }
    }

    if (powerToggle) {
        powerToggle.addEventListener('click', () => {
            const nextState = powerToggle.dataset.on !== 'true';
            setPowerState(nextState);
            sendMovingLightState();
        });
    }

    if (intensitySlider && intensityValue) {
        intensitySlider.addEventListener('input', () => {
            intensityValue.innerText = `${intensitySlider.value}%`;
            sendMovingLightState();
        });
    }

    [redSlider, greenSlider, blueSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', () => {
                updateRGB();
                sendMovingLightState();
            });
        }
    });

    let isDraggingColorWheel = false;

    if (colorWheel) {
        colorWheel.addEventListener('pointerdown', (event) => {
            isDraggingColorWheel = true;
            colorWheel.setPointerCapture(event.pointerId);
            updateRGBFromWheel(event);
            sendMovingLightState();
        });

        colorWheel.addEventListener('pointermove', (event) => {
            if (!isDraggingColorWheel) return;
            updateRGBFromWheel(event);
            sendMovingLightState();
        });

        colorWheel.addEventListener('pointerup', () => {
            isDraggingColorWheel = false;
        });

        colorWheel.addEventListener('pointercancel', () => {
            isDraggingColorWheel = false;
        });
    }

    if (panSlider && panValue) {
        panSlider.addEventListener('input', () => {
            panValue.innerHTML = `${panSlider.value}&deg;`;
            sendMovingLightState();
        });
    }

    if (tiltSlider && tiltValue) {
        tiltSlider.addEventListener('input', () => {
            tiltValue.innerHTML = `${tiltSlider.value}&deg;`;
            sendMovingLightState();
        });
    }

    if (resetAnglesBtn && panSlider && tiltSlider && panValue && tiltValue) {
        resetAnglesBtn.addEventListener('click', () => {
            panSlider.value = 0;
            tiltSlider.value = 0;
            panValue.innerHTML = '0&deg;';
            tiltValue.innerHTML = '0&deg;';
            sendMovingLightState();
        });
    }

    setPowerState(true);
    updateRGB();
}