const STATUS_POLL_MS = 1500;

function clampLevel(value) {
    return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function dmxValueForLevel(level) {
    return Math.round(clampLevel(level) / 100 * 255);
}

async function requestJson(path, options) {
    const response = await fetch(path, options);
    const data = await response.json();

    if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Real DMX request failed.');
    }

    return data;
}

export function setupRealDmxControl() {
    const slider = document.getElementById('realDmxLevel');
    const levelValue = document.getElementById('realDmxLevelValue');
    const dmxValue = document.getElementById('realDmxRawValue');
    const status = document.getElementById('realDmxStatus');
    const statusDot = document.getElementById('realDmxStatusDot');
    const route = document.getElementById('realDmxRoute');
    const outButton = document.getElementById('realDmxOut');

    if (!slider || !levelValue || !dmxValue || !status || !outButton) {
        return;
    }

    let queuedLevel = null;
    let sending = false;
    let interacting = false;

    function renderLevel(level, rawValue = dmxValueForLevel(level)) {
        const normalizedLevel = clampLevel(level);
        slider.value = String(normalizedLevel);
        levelValue.textContent = String(normalizedLevel);
        dmxValue.textContent = String(rawValue);
    }

    function renderStatus(text, connected) {
        status.textContent = text;
        status.className = connected ? 'text-emerald-400' : 'text-red-400';

        if (statusDot) {
            statusDot.className = connected
                ? 'h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]'
                : 'h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_10px_#f87171]';
        }
    }

    async function refreshStatus() {
        try {
            const data = await requestJson('/api/real-dmx/status');
            if (!interacting && !sending && queuedLevel === null) {
                renderLevel(data.level, data.dmxValue);
            }
            if (route) {
                route.textContent = `Gadget ${data.serial} · Port ${data.port} · Address ${data.address}`;
            }
            renderStatus('Gadget connected · real output ready', true);
        } catch (error) {
            renderStatus(error.message, false);
        }
    }

    async function flushLevel() {
        if (sending || queuedLevel === null) return;
        sending = true;

        try {
            while (queuedLevel !== null) {
                const level = queuedLevel;
                queuedLevel = null;
                const data = await requestJson('/api/real-dmx/level', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ level })
                });
                renderLevel(level, data.dmxValue);
                renderStatus(`Real DMX output · ${level}%`, true);
            }
        } catch (error) {
            renderStatus(error.message, false);
        } finally {
            sending = false;
            if (queuedLevel !== null) flushLevel();
        }
    }

    slider.addEventListener('input', () => {
        const level = clampLevel(slider.value);
        renderLevel(level);
        queuedLevel = level;
        flushLevel();
    });
    slider.addEventListener('pointerdown', () => { interacting = true; });
    slider.addEventListener('pointerup', () => { interacting = false; });
    slider.addEventListener('pointercancel', () => { interacting = false; });

    outButton.addEventListener('click', async () => {
        queuedLevel = null;
        try {
            const data = await requestJson('/api/real-dmx/out', { method: 'POST' });
            renderLevel(0, data.dmxValue);
            renderStatus('Real DMX output · OUT', true);
        } catch (error) {
            renderStatus(error.message, false);
        }
    });

    refreshStatus();
    window.setInterval(refreshStatus, STATUS_POLL_MS);
}
