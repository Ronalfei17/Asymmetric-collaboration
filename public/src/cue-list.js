function setupCueList() {
    const cueButtons = document.querySelectorAll('.cue-btn');
    const image = document.getElementById('theatrePlanImage');
    const mapViewport = document.getElementById('mapViewport');
    const mapEmptyState = document.getElementById('mapEmptyState');
    const selectedMapPin = document.getElementById('selectedMapPin');

    function setCueButtonState(activeButton) {
        cueButtons.forEach(button => {
            const cueLabel = button.querySelector('.cue-label');
            const cueName = button.querySelector('.cue-name');

            button.className =
                "cue-btn w-full px-4 py-3 rounded-lg border border-gray-700 bg-white/5 text-left text-gray-200 hover:bg-white/10 transition";

            if (cueLabel) cueLabel.className = "cue-label text-gray-400";
            if (cueName) cueName.className = "cue-name ml-2 text-gray-100";
        });

        const activeLabel = activeButton.querySelector('.cue-label');
        const activeName = activeButton.querySelector('.cue-name');

        activeButton.className =
            "cue-btn w-full px-4 py-3 rounded-lg border border-blue-500/70 bg-blue-500/10 text-left text-blue-400 transition shadow-[0_0_12px_rgba(59,130,246,0.15)]";

        if (activeLabel) activeLabel.className = "cue-label text-blue-400";
        if (activeName) activeName.className = "cue-name ml-2 text-white font-semibold";
    }

    function showMapForCue(button) {
        const mapSrc = button.dataset.map;

        if (mapSrc) {
            if (image) image.src = mapSrc;
            if (mapViewport) mapViewport.classList.remove('hidden');

            if (mapEmptyState) {
                mapEmptyState.classList.add('hidden');
                mapEmptyState.classList.remove('flex');
            }
        } else {
            if (mapViewport) mapViewport.classList.add('hidden');

            if (mapEmptyState) {
                mapEmptyState.classList.remove('hidden');
                mapEmptyState.classList.add('flex');
            }

            if (selectedMapPin) {
                selectedMapPin.classList.add('hidden');
            }
        }
    }

    cueButtons.forEach(button => {
        button.addEventListener('click', () => {
            setCueButtonState(button);
            showMapForCue(button);

            sendControlMessage('cue', {
                cue: button.dataset.cue,
                map: button.dataset.map || null
            });
        });
    });

    const defaultCue = document.querySelector('.cue-btn[data-cue="default"]');
    if (defaultCue) {
        setCueButtonState(defaultCue);
        showMapForCue(defaultCue);
    }
}