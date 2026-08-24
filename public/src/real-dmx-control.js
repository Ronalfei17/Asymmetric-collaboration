const OUTPUT_INTERVAL_MS = 35;
const DEFAULT_ADDRESS = 94;

function clampInteger(value, min, max) {
    return Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
}

function percent(value) {
    return `${Math.round(clampInteger(value, 0, 255) / 255 * 100)}%`;
}

function loadLabels() {
    try {
        return JSON.parse(localStorage.getItem('dmxAttributeLabels') || '{}');
    } catch {
        return {};
    }
}

export function setupRealDmxControl({
    sendControlMessage,
    subscribeControlMessages,
    subscribeControlOpen,
    subscribeControlState
}) {
    const startInput = document.getElementById('realDmxStartAddress');
    const endInput = document.getElementById('realDmxEndAddress');
    const loadButton = document.getElementById('realDmxLoadRange');
    const rangeOutButton = document.getElementById('realDmxRangeOut');
    const blackoutButton = document.getElementById('realDmxBlackout');
    const panel = document.getElementById('realDmxAddressPanel');
    const rowTemplate = document.getElementById('realDmxRowTemplate');
    const status = document.getElementById('realDmxStatus');
    const statusDot = document.getElementById('realDmxStatusDot');
    const route = document.getElementById('realDmxRoute');

    if (!startInput || !endInput || !loadButton || !rangeOutButton ||
        !blackoutButton || !panel || !rowTemplate || !status || !statusDot || !route) {
        return;
    }

    const labels = loadLabels();
    const pendingValues = new Map();
    let cloudConnected = false;
    let agentConnected = false;
    let gadgetConnected = null;
    let activeStart = DEFAULT_ADDRESS;
    let activeEnd = DEFAULT_ADDRESS;
    let outputTimer = null;
    let rangeLoaded = false;
    let lastError = '';

    const savedStartRaw = localStorage.getItem('realDmxStartAddress');
    const savedEndRaw = localStorage.getItem('realDmxEndAddress');
    const savedStart = Number(savedStartRaw);
    const savedEnd = Number(savedEndRaw);
    startInput.value = String(savedStartRaw !== null && Number.isInteger(savedStart)
        ? clampInteger(savedStart, 1, 512)
        : DEFAULT_ADDRESS);
    endInput.value = String(savedEndRaw !== null && Number.isInteger(savedEnd)
        ? clampInteger(savedEnd, 1, 512)
        : DEFAULT_ADDRESS);

    function ready() {
        return cloudConnected && agentConnected && gadgetConnected === true;
    }

    function setStatus(text, state = 'waiting') {
        status.textContent = text;
        const ok = state === 'ok';
        const error = state === 'error';
        const statusColor = ok ? 'text-emerald-400' : error ? 'text-red-400' : 'text-amber-300';
        status.className = `min-w-0 text-[10px] font-semibold leading-tight ${statusColor}`;
        statusDot.className = ok
            ? 'h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]'
            : error
                ? 'h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_8px_#f87171]'
                : 'h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]';
    }

    function updateControls() {
        const disabled = !ready();
        loadButton.disabled = disabled;
        rangeOutButton.disabled = disabled || !rangeLoaded;
        blackoutButton.disabled = disabled;
        panel.querySelectorAll('input[data-role="slider"], input[data-role="value"]').forEach(input => {
            input.disabled = disabled;
        });
    }

    function renderConnectionStatus() {
        if (!cloudConnected) {
            setStatus('Cloud server disconnected', 'error');
        } else if (!agentConnected) {
            setStatus('Lighting control computer disconnected');
        } else if (gadgetConnected === null) {
            setStatus('Lighting control computer connected · Checking Gadget…');
        } else if (!gadgetConnected) {
            setStatus(lastError || 'Gadget disconnected', 'error');
        } else {
            setStatus('Cloud server · Lighting computer · Gadget connected', 'ok');
        }
        updateControls();
    }

    function normalizeRange() {
        activeStart = clampInteger(startInput.value, 1, 512);
        activeEnd = clampInteger(endInput.value, 1, 512);
        if (activeStart > activeEnd) [activeStart, activeEnd] = [activeEnd, activeStart];
        startInput.value = String(activeStart);
        endInput.value = String(activeEnd);
        localStorage.setItem('realDmxStartAddress', String(activeStart));
        localStorage.setItem('realDmxEndAddress', String(activeEnd));
        return { start: activeStart, end: activeEnd };
    }

    function send(type, payload = {}) {
        if (sendControlMessage(type, payload)) return true;
        cloudConnected = false;
        renderConnectionStatus();
        return false;
    }

    function loadRange() {
        const range = normalizeRange();
        if (!ready()) {
            renderConnectionStatus();
            return;
        }
        setStatus(`Loading Address ${range.start}–${range.end}…`);
        send('dmx-range-status-request', { port: 1, ...range });
    }

    function updateRow(row, value) {
        const next = clampInteger(value, 0, 255);
        row.querySelector('[data-role="slider"]').value = String(next);
        row.querySelector('[data-role="value"]').value = String(next);
        row.querySelector('[data-role="percent"]').textContent = percent(next);
    }

    function flushValues() {
        outputTimer = null;
        const entries = [...pendingValues.entries()];
        pendingValues.clear();
        entries.forEach(([address, value]) => {
            send('dmx-output', { port: 1, address, value });
        });
        if (pendingValues.size) scheduleFlush();
    }

    function scheduleFlush() {
        if (!outputTimer) {
            outputTimer = window.setTimeout(flushValues, OUTPUT_INTERVAL_MS);
        }
    }

    function queueValue(address, value, row) {
        const next = clampInteger(value, 0, 255);
        updateRow(row, next);
        pendingValues.set(address, next);
        scheduleFlush();
    }

    function renderRows(items) {
        panel.replaceChildren();
        items.forEach(item => {
            const fragment = rowTemplate.content.cloneNode(true);
            const row = fragment.firstElementChild;
            const address = clampInteger(item.address, 1, 512);
            const value = clampInteger(item.value, 0, 255);
            const addressElement = row.querySelector('[data-role="address"]');
            const nameInput = row.querySelector('[data-role="name"]');
            const slider = row.querySelector('[data-role="slider"]');
            const valueInput = row.querySelector('[data-role="value"]');

            row.dataset.address = String(address);
            addressElement.textContent = `A${address}`;
            nameInput.value = labels[address] || '';
            slider.setAttribute('aria-label', `Address ${address}`);
            updateRow(row, value);

            slider.addEventListener('input', event => queueValue(address, event.target.value, row));
            valueInput.addEventListener('change', event => queueValue(address, event.target.value, row));
            nameInput.addEventListener('change', event => {
                labels[address] = event.target.value.trim();
                localStorage.setItem('dmxAttributeLabels', JSON.stringify(labels));
            });
            panel.appendChild(fragment);
        });
        rangeLoaded = true;
        updateControls();
    }

    function zeroVisibleRows() {
        panel.querySelectorAll('[data-address]').forEach(row => updateRow(row, 0));
    }

    subscribeControlState((connected) => {
        cloudConnected = connected;
        if (!connected) {
            agentConnected = false;
            gadgetConnected = null;
        }
        renderConnectionStatus();
    });

    subscribeControlOpen(() => {
        cloudConnected = true;
        renderConnectionStatus();
        const range = normalizeRange();
        send('dmx-range-status-request', { port: 1, ...range });
    });

    subscribeControlMessages(message => {
        if (!message || typeof message !== 'object') return;

        if (message.type === 'dmx-agent-status') {
            const wasReady = ready();
            agentConnected = Boolean(message.connected);
            if (!agentConnected) {
                gadgetConnected = null;
            } else if (typeof message.gadgetConnected === 'boolean') {
                gadgetConnected = message.gadgetConnected;
            }
            lastError = message.error || '';
            if (message.serial) {
                route.textContent = `Cloud → Lighting computer → Gadget ${message.serial} · Port ${message.port || 1}`;
            }
            renderConnectionStatus();
            if (!wasReady && ready() && !rangeLoaded) loadRange();
            return;
        }

        if (message.type === 'dmx-range-status') {
            if (!message.ok) {
                lastError = message.error || 'Failed to load DMX addresses';
                if (message.gadgetConnected === false) gadgetConnected = false;
                renderConnectionStatus();
                return;
            }
            agentConnected = true;
            gadgetConnected = true;
            activeStart = message.start;
            activeEnd = message.end;
            if (message.serial) {
                route.textContent = `Cloud → Lighting computer → Gadget ${message.serial} · Port ${message.port || 1} · Address ${activeStart}–${activeEnd}`;
            }
            renderRows(message.values || []);
            setStatus(`${(message.values || []).length} attribute address(es) loaded`, 'ok');
            return;
        }

        if (message.type !== 'dmx-result') return;
        if (!message.ok) {
            lastError = message.error || 'Real DMX output failed';
            if (message.gadgetConnected === false) gadgetConnected = false;
            renderConnectionStatus();
            return;
        }

        if (message.operation === 'range-out') {
            zeroVisibleRows();
            setStatus(`Address ${message.start}–${message.end} reset to zero`, 'ok');
        } else if (message.operation === 'blackout') {
            zeroVisibleRows();
            setStatus('All 512 DMX addresses reset to zero', 'ok');
        } else {
            setStatus(`Real DMX output · Address ${message.address} = ${message.value}`, 'ok');
        }
    });

    loadButton.addEventListener('click', loadRange);
    [startInput, endInput].forEach(input => input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loadRange();
        }
    }));

    rangeOutButton.addEventListener('click', () => {
        send('dmx-range-out', { port: 1, start: activeStart, end: activeEnd });
    });

    blackoutButton.addEventListener('click', () => {
        send('dmx-blackout', { port: 1 });
    });

    normalizeRange();
    renderConnectionStatus();
}
