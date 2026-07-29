const NO_CUE_VALUE = '';
const NEW_CUE_VALUE = '__new_cue__';
const LONG_PRESS_MS = 700;
const MOVE_CANCEL_DISTANCE = 8;

function getElement(id) {
    return document.getElementById(id);
}

function showModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function formatFixtureLabel(fixture) {
    if (!fixture) return 'Selected fixture';

    return fixture.displayId ||
        `CH ${fixture.lightId}`;
}

function formatCueSelectLabel(cue) {
    const cueNumber = Number(cue?.cueNumber);
    const cueName = String(cue?.name || '').trim();

    return cueName
        ? `Cue ${cueNumber} — ${cueName}`
        : `Cue ${cueNumber}`;
}

function formatCueTagLabel(cue) {
    return `Cue ${Number(cue?.cueNumber)}`;
}

function sortCues(cues) {
    return [...cues].sort(
        (a, b) => Number(a.cueNumber) - Number(b.cueNumber)
    );
}

function getNextCueNumber(cues) {
    if (!cues.length) return 0;

    return Math.max(
        ...cues.map(cue => Number(cue.cueNumber) || 0)
    ) + 1;
}

function createSeparatorOption(label = '────────────') {
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = label;
    return option;
}

function getTagClass(isEditing) {
    return [
        'included-cue-tag',
        'inline-flex',
        'items-center',
        'justify-center',
        'h-7',
        'min-w-[64px]',
        'rounded-md',
        'border',
        'px-2.5',
        'text-[10px]',
        'font-medium',
        'transition',
        'touch-manipulation',
        'select-none',
        isEditing
            ? 'border-blue-500/70 bg-blue-500/15 text-blue-200 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
            : 'border-gray-700 bg-[#06080c] text-gray-300 hover:border-blue-500/40 hover:text-blue-200'
    ].join(' ');
}

function bindLongPress(button, {
    onTap,
    onLongPress
}) {
    let timer = null;
    let startPoint = null;
    let longPressTriggered = false;
    let suppressClickUntil = 0;

    function clearLongPressTimer() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    }

    button.addEventListener('pointerdown', event => {
        if (event.button !== undefined && event.button !== 0) return;

        longPressTriggered = false;
        startPoint = {
            x: event.clientX,
            y: event.clientY
        };

        button.classList.add('scale-[0.98]');

        timer = setTimeout(() => {
            timer = null;
            longPressTriggered = true;
            suppressClickUntil = Date.now() + 500;
            button.classList.remove('scale-[0.98]');

            if (typeof navigator.vibrate === 'function') {
                navigator.vibrate(30);
            }

            onLongPress?.();
        }, LONG_PRESS_MS);
    });

    button.addEventListener('pointermove', event => {
        if (!startPoint || !timer) return;

        const distance = Math.hypot(
            event.clientX - startPoint.x,
            event.clientY - startPoint.y
        );

        if (distance > MOVE_CANCEL_DISTANCE) {
            clearLongPressTimer();
            button.classList.remove('scale-[0.98]');
        }
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(eventName => {
        button.addEventListener(eventName, () => {
            clearLongPressTimer();
            startPoint = null;
            button.classList.remove('scale-[0.98]');
        });
    });

    button.addEventListener('click', event => {
        if (longPressTriggered || Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
            longPressTriggered = false;
            return;
        }

        onTap?.();
    });

    button.addEventListener('contextmenu', event => {
        event.preventDefault();
    });
}

export function setupCueEditorUI({
    onSelectCue,
    onCreateCue,
    onRemoveFixtureFromCue
} = {}) {
    const editingCueSelect = getElement('editingCueSelect');
    const includedCuesSection = getElement('includedCuesSection');
    const includedCueTags = getElement('includedCueTags');
    const cueEditorStatus = getElement('cueEditorStatus');

    const createCueModal = getElement('createCueModal');
    const newCueNumberLabel = getElement('newCueNumberLabel');
    const newCueNameInput = getElement('newCueNameInput');
    const cancelCreateCueButton = getElement('cancelCreateCueButton');
    const confirmCreateCueButton = getElement('confirmCreateCueButton');

    const removeFixtureFromCueModal = getElement('removeFixtureFromCueModal');
    const removeFixtureCueTitle = getElement('removeFixtureCueTitle');
    const removeFixtureCueMessage = getElement('removeFixtureCueMessage');
    const cancelRemoveFixtureButton = getElement('cancelRemoveFixtureButton');
    const confirmRemoveFixtureButton = getElement('confirmRemoveFixtureButton');

    let viewState = {
        cues: [],
        editingCueId: null,
        includedCues: [],
        selectedFixture: null
    };

    let pendingRemoveCueId = null;
    let statusTimer = null;
    let isCreatingCue = false;
    let isRemovingFixture = false;

    function setStatus(message, {
        tone = 'neutral',
        duration = 1800
    } = {}) {
        if (!cueEditorStatus) return;

        clearTimeout(statusTimer);

        if (!message) {
            cueEditorStatus.textContent = '';
            cueEditorStatus.classList.add('hidden');
            return;
        }

        const toneClass = {
            neutral: 'text-gray-500',
            success: 'text-emerald-400',
            warning: 'text-amber-400',
            error: 'text-red-400'
        }[tone] || 'text-gray-500';

        cueEditorStatus.className = `mt-2 text-[10px] ${toneClass}`;
        cueEditorStatus.textContent = message;
        cueEditorStatus.classList.remove('hidden');

        if (duration > 0) {
            statusTimer = setTimeout(() => {
                cueEditorStatus.classList.add('hidden');
            }, duration);
        }
    }

    function renderSelect() {
        if (!editingCueSelect) return;

        const sortedCues = sortCues(viewState.cues);

        editingCueSelect.innerHTML = '';
        editingCueSelect.disabled = !viewState.selectedFixture;

        const noCueOption = document.createElement('option');
        noCueOption.value = NO_CUE_VALUE;
        noCueOption.textContent = 'No Cue — Live Control';
        editingCueSelect.appendChild(noCueOption);

        if (sortedCues.length > 0) {
            editingCueSelect.appendChild(createSeparatorOption());
        }

        sortedCues.forEach(cue => {
            const option = document.createElement('option');

            option.value = String(cue.id);
            option.textContent = formatCueSelectLabel(cue);
            editingCueSelect.appendChild(option);
        });

        editingCueSelect.appendChild(createSeparatorOption());

        const newCueOption = document.createElement('option');
        newCueOption.value = NEW_CUE_VALUE;
        newCueOption.textContent = '+ New Cue';
        editingCueSelect.appendChild(newCueOption);

        editingCueSelect.value = viewState.editingCueId || NO_CUE_VALUE;
    }

    function renderIncludedCueTags() {
        if (!includedCuesSection || !includedCueTags) return;

        const shouldShow = Boolean(
            viewState.selectedFixture &&
            viewState.editingCueId
        );

        includedCuesSection.classList.toggle('hidden', !shouldShow);
        includedCueTags.innerHTML = '';

        if (!shouldShow) return;

        const includedCues = sortCues(viewState.includedCues);

        if (includedCues.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'text-[11px] text-gray-500';
            empty.textContent = 'This fixture is not included in any Cue.';
            includedCueTags.appendChild(empty);
            return;
        }

        includedCues.forEach(cue => {
            const isEditing = String(cue.id) === String(viewState.editingCueId);
            const button = document.createElement('button');

            button.type = 'button';
            button.dataset.includedCueId = cue.id;
            button.dataset.editing = String(isEditing);
            button.className = getTagClass(isEditing);
            button.title = 'Tap to edit. Long press to remove this fixture from the Cue.';
            button.setAttribute(
                'aria-label',
                `${formatCueSelectLabel(cue)}. ${isEditing ? 'Currently editing.' : ''} Tap to edit; long press to remove.`
            );

            const cueLabel = document.createElement('span');

            cueLabel.textContent = formatCueTagLabel(cue);

            button.appendChild(cueLabel);

            bindLongPress(button, {
                onTap: () => {
                    onSelectCue?.(cue.id);
                },
                onLongPress: () => {
                    openRemoveFixtureModal(cue.id);
                }
            });

            includedCueTags.appendChild(button);
        });
    }

    function render(nextState = {}) {
        viewState = {
            cues: Array.isArray(nextState.cues) ? nextState.cues : [],
            editingCueId: nextState.editingCueId || null,
            includedCues: Array.isArray(nextState.includedCues)
                ? nextState.includedCues
                : [],
            selectedFixture: nextState.selectedFixture || null
        };

        renderSelect();
        renderIncludedCueTags();
    }

    function openCreateCueModal() {
        const nextCueNumber = getNextCueNumber(viewState.cues);

        if (newCueNumberLabel) {
            newCueNumberLabel.textContent = `Cue ${nextCueNumber}`;
        }

        if (newCueNameInput) {
            newCueNameInput.value = `Default${nextCueNumber}`;
        }

        showModal(createCueModal);

        newCueNameInput?.focus({ preventScroll: true });
        newCueNameInput?.select();
    }

    function closeCreateCueModal() {
        hideModal(createCueModal);
        confirmCreateCueButton?.removeAttribute('disabled');
    }

    async function confirmCreateCue() {
        if (isCreatingCue) return;
        if (!viewState.selectedFixture) {
            setStatus('Select a fixture before creating a Cue.', {
                tone: 'warning'
            });
            closeCreateCueModal();
            return;
        }

        const nextCueNumber = getNextCueNumber(viewState.cues);
        const name = String(newCueNameInput?.value || '').trim() ||
            `Default${nextCueNumber}`;

        isCreatingCue = true;
        confirmCreateCueButton?.setAttribute('disabled',"true");

        try {
            await onCreateCue?.({ name });
            closeCreateCueModal();
        } catch (error) {
            console.error('[CueEditorUI] Failed to create Cue:', error);
            setStatus(error?.message || 'Failed to create Cue.', {
                tone: 'error',
                duration: 3000
            });
        }
        finally{
            isCreatingCue = false;
            confirmCreateCueButton?.removeAttribute('disabled');
        }
    }

    function openRemoveFixtureModal(cueId) {
        const cue = viewState.cues.find(
            item => String(item.id) === String(cueId)
        );

        if (!cue || !viewState.selectedFixture) return;

        pendingRemoveCueId = cue.id;
        const fixtureLabel = formatFixtureLabel(viewState.selectedFixture);

        if (removeFixtureCueTitle) {
            removeFixtureCueTitle.textContent =
                `Remove ${fixtureLabel} from Cue ${cue.cueNumber}?`;
        }

        if (removeFixtureCueMessage) {
            removeFixtureCueMessage.textContent =
                `${fixtureLabel} will no longer be stored or applied as part of “${cue.name}”. ` +
                'The Cue itself and the current live lighting state will not be deleted.';
        }

        showModal(removeFixtureFromCueModal);
    }

    function closeRemoveFixtureModal() {
        pendingRemoveCueId = null;
        hideModal(removeFixtureFromCueModal);
        confirmRemoveFixtureButton?.removeAttribute('disabled');
    }

    async function confirmRemoveFixture() {
        if (isRemovingFixture || !pendingRemoveCueId) return;

        const cueId = pendingRemoveCueId;
        isRemovingFixture = true;
        confirmRemoveFixtureButton?.setAttribute('disabled', 'true');

        try {
            await onRemoveFixtureFromCue?.(cueId);
            closeRemoveFixtureModal();
        } catch (error) {
            console.error('[CueEditorUI] Failed to remove fixture:', error);
            setStatus(error?.message || 'Failed to remove fixture from Cue.', {
                tone: 'error',
                duration: 3000
            });
        } finally{
            isRemovingFixture = false;
            confirmRemoveFixtureButton?.removeAttribute('disabled');
        }
    }

    editingCueSelect?.addEventListener('change', () => {
        const selectedValue = editingCueSelect.value;

        if (selectedValue === NEW_CUE_VALUE) {
            editingCueSelect.value = viewState.editingCueId || NO_CUE_VALUE;
            openCreateCueModal();
            return;
        }

        onSelectCue?.(selectedValue || null);
    });

    cancelCreateCueButton?.addEventListener('click', closeCreateCueModal);
    confirmCreateCueButton?.addEventListener('click', confirmCreateCue);

    newCueNameInput?.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            confirmCreateCue();
        }
    });

    cancelRemoveFixtureButton?.addEventListener('click', closeRemoveFixtureModal);
    confirmRemoveFixtureButton?.addEventListener('click', confirmRemoveFixture);

    [createCueModal, removeFixtureFromCueModal].forEach(modal => {
        modal?.addEventListener('click', event => {
            if (event.target !== modal) return;

            if (modal === createCueModal) {
                closeCreateCueModal();
            } else {
                closeRemoveFixtureModal();
            }
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;

        if (createCueModal && !createCueModal.classList.contains('hidden')) {
            closeCreateCueModal();
        }

        if (
            removeFixtureFromCueModal &&
            !removeFixtureFromCueModal.classList.contains('hidden')
        ) {
            closeRemoveFixtureModal();
        }
    });

    render();

    return {
        render,
        setStatus,
        openCreateCueModal,
        closeCreateCueModal,
        closeRemoveFixtureModal
    };
}


