export function mockConnect(isConnected) {
    const sideWifiBox = document.getElementById('sidebar-wifi-icon');
    const wifiIcon = document.getElementById('wifi-lucide-icon');
    const topBlock = document.getElementById('top-status-block');
    const topDot = document.getElementById('top-status-dot');
    const topText = document.getElementById('top-status-text');
    const bottomText = document.getElementById('bottom-status-text');

    if (!sideWifiBox || !topBlock || !topDot || !topText || !bottomText) return;

    if (isConnected) {
        sideWifiBox.className = 'p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 transition-all duration-300';
        wifiIcon?.classList.add('animate-pulse');
        topBlock.className = 'flex items-center space-x-2 text-green-400 font-medium transition-all duration-300';
        topDot.className = 'w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]';
        topText.innerText = 'Connected';
        bottomText.className = 'text-green-500 font-medium transition-all duration-300';
        bottomText.innerText = 'Connected';
    } else {
        sideWifiBox.className = 'p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 transition-all duration-300';
        wifiIcon?.classList.remove('animate-pulse');
        topBlock.className = 'flex items-center space-x-2 text-red-500 font-medium transition-all duration-300';
        topDot.className = 'w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]';
        topText.innerText = 'Disconnected';
        bottomText.className = 'text-red-500 font-medium transition-all duration-300';
        bottomText.innerText = 'Disconnected';
    }
}

export function setupStatus() {
    document.getElementById('mockConnectBtn')?.addEventListener('click', () => mockConnect(true));
    document.getElementById('mockDisconnectBtn')?.addEventListener('click', () => mockConnect(false));

    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            function updateBatteryStatus() {
                const level = Math.round(battery.level * 100);
                document.getElementById('battery-level').innerText = `${level}%`;
                document.getElementById('battery-bar').style.width = `${level}%`;
                document.getElementById('charging-status').classList.toggle('hidden', !battery.charging);
            }

            updateBatteryStatus();
            battery.addEventListener('levelchange', updateBatteryStatus);
            battery.addEventListener('chargingchange', updateBatteryStatus);
        });
    }

    setInterval(() => {
        const clock = document.getElementById('live-clock');
        if (clock) clock.innerText = new Date().toTimeString().split(' ')[0];
    }, 1000);
}