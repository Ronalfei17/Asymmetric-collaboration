const MAPS = {
    theatre: {
        title: 'THEATRE MAP + INTERACTIVE OVERLAY',
        src: './assets/vandyck-theatre-plan.jpg',
        alt: 'Theatre Map',
        invert: true
    },

    lighting: {
        title: 'LIGHTING MAP + INTERACTIVE OVERLAY',
        src: './assets/LightingMap-background.png',
        alt: 'Lighting Map',
        invert: false
    }
};

let activeMapType = 'theatre';

function setButtonState(activeType){
    const theatreButton = document.getElementById('theatreMapButton');
    const lightingButton = document.getElementById('lightingMapButton');

    const buttons = [theatreButton, lightingButton];

    const activeClasses = [
        'bg-blue-500',
        'text-white',
        'shadow-[0_0_14px_rgba(59,130,246,0.28)]'
    ];

    const inactiveClasses = [
        'text-gray-300',
        'bg-transparent'
    ];

    buttons.forEach(button => {
        if (!button) return;

        const isActive = button.dataset.mapType === activeType;

        button.classList.remove(
            'bg-blue-500',
            'text-white',
            'text-gray-300',
            'shadow-[0_0_14px_rgba(59,130,246,0.28)]',
            'bg-transparent'
        );

        if (isActive) {
            button.classList.add(...activeClasses);
        } else {
            button.classList.add(...inactiveClasses);
        }
    });
}

function setActiveMap(mapType) {
    const map = MAPS[mapType];

    const image = document.getElementById('theatrePlanImage');
    const title = document.getElementById('mapPanelTitle');
    const selectedMapPin = document.getElementById('selectedMapPin');
    
    if (!map || !image || !title) {
        console.warn('[MapSwitcher] Missing map config.');
        return;
    }

    activeMapType = mapType;
    image.dataset.activeMapType = mapType;
    title.textContent = map.title;

    const shouldShowQuestPin =
    mapType === 'theatre' &&
    selectedMapPin?.dataset.hasMapPosition === 'true';

    selectedMapPin?.classList.toggle('hidden', !shouldShowQuestPin);

    setButtonState(mapType);

    image.style.visibility = 'hidden';

    const handleImageLoaded = () => {
        image.alt = map.alt;
        image.classList.toggle('invert', map.invert);

        requestAnimationFrame(() => {
            image.style.visibility = 'visible';
        });
    };

    image.addEventListener('load', handleImageLoaded, {
        once: true
    });

    image.src = map.src;

    window.dispatchEvent(new CustomEvent('map-type-changed', {
        detail: {
            mapType
        }
    }));

    console.log('[MapSwitcher] Active map:', mapType);
}

export function setupMapSwitcher() {
    const image = document.getElementById('theatrePlanImage');
    const theatreButton = document.getElementById('theatreMapButton');
    const lightingButton = document.getElementById('lightingMapButton');

    if (!image || !theatreButton || !lightingButton) {
        console.warn('[MapSwitcher] Missing required DOM elements.');
        return;
    }

    image.dataset.activeMapType = activeMapType;

    theatreButton.addEventListener('click', () => {
        setActiveMap('theatre');
    });

    lightingButton.addEventListener('click', () => {
        setActiveMap('lighting');
    });

    setActiveMap(activeMapType);
}

export function switchToLightingMap() {
    setActiveMap('lighting');
}

export function switchToTheatreMap() {
    setActiveMap('theatre');
}