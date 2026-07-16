import {
    getFixtureTypes,
    getFixturesByType,
    getFixtureTypeLabel
} from './lighting-fixture.js';

import {
    selectLightingFixtureById,
    getSelectedLightingFixture
} from './lighting-control.js';

const TYPE_ORDER = getFixtureTypes();

function getElement(id) {
    return document.getElementById(id);
}

function getAllFixtures() {
    return TYPE_ORDER.flatMap(type => getFixturesByType(type));
}

function getFixtureDisplayName(fixture) {
    return fixture.label ||
        fixture.name ||
        fixture.modelLabel ||
        fixture.fixtureModel ||
        `Light ${fixture.lightId}`;
}

function getFixtureChannelLabel(fixture) {
    return fixture.displayId || `CH ${fixture.lightId}`;
}

function getFixtureTypeIcon(fixtureType) {
    const iconMap = {
        profile: 'flashlight',
        led: 'panel-top',
        fresnel: 'square',
        moving: 'rotate-3d'
    };

    return iconMap[fixtureType] || 'lightbulb';
}

function setActiveTab(activeMode) {
    document.querySelectorAll('[data-fixture-library-tab]').forEach(button => {
        const isActive = button.dataset.fixtureLibraryTab === activeMode;

        button.classList.toggle('bg-blue-500/20', isActive);
        button.classList.toggle('border-blue-500/60', isActive);
        button.classList.toggle('text-blue-300', isActive);

        button.classList.toggle('bg-white/5', !isActive);
        button.classList.toggle('border-gray-700', !isActive);
        button.classList.toggle('text-gray-300', !isActive);
    });
}

function renderFixtureButton(fixture) {
    const selectedFixture = getSelectedLightingFixture();
    const isSelected = selectedFixture &&
        Number(selectedFixture.lightId) === Number(fixture.lightId);

    const button = document.createElement('button');

    button.type = 'button';
    button.dataset.lightId = fixture.lightId;
    button.className = [
        'fixture-library-item',
        'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition',
        isSelected
            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/50'
            : 'text-gray-300 hover:bg-white/5 border border-transparent'
    ].join(' ');

    button.innerHTML = `
        <i data-lucide="${getFixtureTypeIcon(fixture.fixtureType)}" class="w-4 h-4 shrink-0"></i>
        <div class="min-w-0 flex-1">
            <div class="text-[11px] truncate">${getFixtureDisplayName(fixture)}</div>
            <div class="text-[10px] text-gray-500 truncate">${getFixtureChannelLabel(fixture)}</div>
        </div>
    `;

    button.addEventListener('click', () => {
        selectLightingFixtureById(fixture.lightId);
        renderFixtureLibrary(getCurrentMode());
    });

    return button;
}

function renderFixtureGroup(title, fixtures) {
    const group = document.createElement('div');
    group.className = 'fixture-library-group border-b border-gray-800/70 pb-2 last:border-b-0';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-1 py-2 text-[11px] text-gray-400 font-semibold';

    header.innerHTML = `
        <span>${title}</span>
        <span>${fixtures.length}</span>
    `;

    const list = document.createElement('div');
    list.className = 'space-y-1';

    fixtures.forEach(fixture => {
        list.appendChild(renderFixtureButton(fixture));
    });

    group.appendChild(header);
    group.appendChild(list);

    return group;
}

function getCurrentMode() {
    const activeButton = document.querySelector('[data-fixture-library-tab].bg-blue-500\\/20');
    return activeButton?.dataset.fixtureLibraryTab || 'all';
}

export function renderFixtureLibrary(mode = 'all') {
    const container = getElement('fixtureLibraryList');

    if (!container) {
        console.warn('[FixtureLibrary] #fixtureLibraryList not found');
        return;
    }

    container.innerHTML = '';
    setActiveTab(mode);

    if (mode === 'by-type') {
        TYPE_ORDER.forEach(type => {
            const fixtures = getFixturesByType(type);

            if (!fixtures.length) return;

            container.appendChild(
                renderFixtureGroup(getFixtureTypeLabel(type), fixtures)
            );
        });
    } else {
        container.appendChild(
            renderFixtureGroup('All Fixtures', getAllFixtures())
        );
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function setupFixtureLibrary() {
    renderFixtureLibrary('all');

    document.querySelectorAll('[data-fixture-library-tab]').forEach(button => {
        button.addEventListener('click', () => {
            renderFixtureLibrary(button.dataset.fixtureLibraryTab);
        });
    });
}