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
let currentMode = 'all';

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

function renderFixtureTypeDropdownGroup(type) {
    const fixtures = getFixturesByType(type);
    const selectedFixture = getSelectedLightingFixture();

    const group = document.createElement('div');

    group.className = [
        'fixture-library-type-group',
        'border-b border-gray-800/70 pb-3',
        'last:border-b-0'
    ].join(' ');

    const label = document.createElement('div');

    label.className =
        'px-1 py-2 text-[11px] text-gray-400 font-semibold';

    label.textContent = getFixtureTypeLabel(type);

    const select = document.createElement('select');

    select.setAttribute(
        'aria-label',
        `Select ${getFixtureTypeLabel(type)} fixture`
    );

    select.className = [
        'w-full h-10 rounded-md',
        'border border-gray-700',
        'bg-[#0b0f16]',
        'px-3 text-[11px] text-gray-200',
        'focus:outline-none',
        'focus:border-blue-500'
    ].join(' ');

    const placeholder = document.createElement('option');

    placeholder.value = '';
    placeholder.textContent =
        `Select ${getFixtureTypeLabel(type)} fixture`;

    select.appendChild(placeholder);

    fixtures.forEach(fixture => {
        const option = document.createElement('option');

        option.value = String(fixture.lightId);

        option.textContent =
            `${getFixtureChannelLabel(fixture)} — ${getFixtureDisplayName(fixture)}`;

        if (
            selectedFixture &&
            Number(selectedFixture.lightId) ===
            Number(fixture.lightId)
        ) {
            option.selected = true;
        }

        select.appendChild(option);
    });

    select.addEventListener('change', event => {
        const rawValue = event.target.value;

        if (rawValue === '') {
            return;
        }

        const lightId = Number(rawValue);

        if (!Number.isFinite(lightId)) {
            return;
        }

        selectLightingFixtureById(lightId);
    });

    group.appendChild(label);
    group.appendChild(select);

    return group;
}

function getCurrentMode() {
    return currentMode;
}

export function renderFixtureLibrary(mode = 'all') {
    currentMode = mode;
    
    const container = getElement('fixtureLibraryList');

    if (!container) {
        console.warn('[FixtureLibrary] #fixtureLibraryList not found');
        return;
    }

    container.innerHTML = '';
    setActiveTab(mode);

    if (mode === 'by-type') {
        TYPE_ORDER.forEach(type => {
            const fixtures =
                getFixturesByType(type);

            if (!fixtures.length) {
                return;
            }

            container.appendChild(
                renderFixtureTypeDropdownGroup(type)
            );
        });
    } else {
        container.appendChild(
            renderFixtureGroup(
                'All Fixtures',
                getAllFixtures()
            )
        );
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function refreshFixtureLibrarySelection({
    scrollIntoView = false
} = {}) {
    renderFixtureLibrary(getCurrentMode());

    if (!scrollIntoView) {
        return;
    }

    const selectedFixture =
        getSelectedLightingFixture();

    if (!selectedFixture) {
        return;
    }

    requestAnimationFrame(() => {
        const selectedButton =
            document.querySelector(
                `.fixture-library-item[data-light-id="${selectedFixture.lightId}"]`
            );

        selectedButton?.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    });
}

export function setupFixtureLibrary() {
    renderFixtureLibrary('all');

    document
        .querySelectorAll(
            '[data-fixture-library-tab]'
        )
        .forEach(button => {
            button.addEventListener('click', () => {
                renderFixtureLibrary(
                    button.dataset.fixtureLibraryTab
                );
            });
        });

    window.addEventListener(
        'lighting-fixture-selected',
        event => {
            const lightId =
                Number(event.detail?.lightId);

            if (!Number.isFinite(lightId)) {
                return;
            }

            refreshFixtureLibrarySelection({
                scrollIntoView:
                    currentMode === 'all'
            });
        }
    );
}