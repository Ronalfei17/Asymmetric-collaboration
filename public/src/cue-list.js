import { getCues, getCueById, getAppliedCueId, setAppliedCueId, renameCue, deleteCue, subscribeCueStore } from './cue-store.js';
import { flushLightingCueEdits } from './lighting-control.js';

const CUE_FIXTURE_SEND_INTERVAL_MS = 20;
const CUE_PLAYBACK_SETTLE_MS = 250;

function getCueButtonClass(isSelected) {
    return [
        'cue-btn',
        'w-full',
        'px-4',
        'py-2',
        'rounded-lg',
        'border',
        'text-left',
        'transition',
        isSelected
            ? [
                'border-blue-500/70',
                'bg-blue-500/10',
                'text-blue-400',
                'shadow-[0_0_12px_rgba(59,130,246,0.15)]'
            ].join(' ')
            : [
                'border-gray-700',
                'bg-white/5',
                'text-gray-200',
                'hover:bg-white/10'
            ].join(' ')
    ].join(' ');
}

function isSnapshotOn(snapshot) {
    const value = snapshot?.isOn;

    return (
        value === true ||
        value === 'true' ||
        value === 1 ||
        value === '1'
    );
}

function getFixtureCount(cue) {
    const snapshots =
        Object.values(cue?.fixtures || {});

    if (Number(cue?.cueNumber) === 0) {
        return snapshots.filter(
            isSnapshotOn
        ).length;
    }

    return snapshots.length;
}

function getFixtureCountLabel(cue, fixtureCount) {
    if (Number(cue?.cueNumber) === 0) {
        return (
            `${fixtureCount} active fixture` +
            `${fixtureCount === 1 ? '' : 's'}`
        );
    }

    return (
        `${fixtureCount} fixture` +
        `${fixtureCount === 1 ? '' : 's'}`
    );
}

export function setupCueList(sendControlMessage) {
    const cueListContainer = document.getElementById('homeCueList') || document.querySelector('.cue-btn')?.parentElement;
    const runtimeStatus = document.getElementById('homeCueRuntimeStatus');

    if (!cueListContainer) {
        console.warn(
            '[CueList] Cue List container not found.'
        );
        return;
    }

    const renameCueModal =
            document.getElementById(
                'renameCueModal'
            );
    
        const renameCueNumberLabel =
            document.getElementById(
                'renameCueNumberLabel'
            );
    
        const renameCueNameInput =
            document.getElementById(
                'renameCueNameInput'
            );
    
        const cancelRenameCueButton =
            document.getElementById(
                'cancelRenameCueButton'
            );
    
        const confirmRenameCueButton =
            document.getElementById(
                'confirmRenameCueButton'
            );
    
        const deleteCueModal =
            document.getElementById(
                'deleteCueModal'
            );
    
        const deleteCueTitle =
            document.getElementById(
                'deleteCueTitle'
            );
    
        const deleteCueMessage =
            document.getElementById(
                'deleteCueMessage'
            );
    
        const cancelDeleteCueButton =
            document.getElementById(
                'cancelDeleteCueButton'
            );
    
        const confirmDeleteCueButton =
            document.getElementById(
                'confirmDeleteCueButton'
            );
    
        let pendingRenameCueId = null;
        let pendingDeleteCueId = null;
    
        function isProtectedCue(cue) {
            return (
                Number(cue?.cueNumber) === 0
            );
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
    
        function renderRuntimeStatus() {
            if (!runtimeStatus) return;
    
            const appliedCueId =
                getAppliedCueId();
    
            const isLiveControl =
                !appliedCueId;
    
            runtimeStatus.classList.toggle(
                'hidden',
                !isLiveControl
            );
    
            runtimeStatus.textContent =
                'Live Control';
        }
    
        function openRenameCueModal(cue) {
            if (
                !cue ||
                isProtectedCue(cue)
            ) {
                return;
            }
    
            pendingRenameCueId =
                String(cue.id);
    
            if (renameCueNumberLabel) {
                renameCueNumberLabel.textContent =
                    `Cue ${cue.cueNumber}`;
            }
    
            if (renameCueNameInput) {
                renameCueNameInput.value =
                    String(cue.name || '');
            }
    
            showModal(renameCueModal);
    
            requestAnimationFrame(() => {
                renameCueNameInput?.focus();
                renameCueNameInput?.select();
            });
        }
    
        function closeRenameCueModal() {
            pendingRenameCueId = null;
            hideModal(renameCueModal);
        }
    
        function confirmRenameCue() {
            if (!pendingRenameCueId) {
                return;
            }
    
            const cue =
                getCueById(
                    pendingRenameCueId
                );
    
            if (
                !cue ||
                isProtectedCue(cue)
            ) {
                closeRenameCueModal();
                return;
            }
    
            const nextName =
                String(
                    renameCueNameInput?.value ||
                    ''
                ).trim();
    
            if (!nextName) {
                renameCueNameInput?.focus();
                return;
            }
    
            try {
                renameCue(
                    cue.id,
                    nextName
                );
    
                closeRenameCueModal();
            } catch (error) {
                console.error(
                    '[CueList] Rename Cue failed:',
                    error
                );
            }
        }
    
        function openDeleteCueModal(cue) {
            if (
                !cue ||
                isProtectedCue(cue)
            ) {
                return;
            }
    
            pendingDeleteCueId =
                String(cue.id);
    
            if (deleteCueTitle) {
                deleteCueTitle.textContent =
                    `Delete Cue ${cue.cueNumber}?`;
            }
    
            if (deleteCueMessage) {
                deleteCueMessage.textContent =
                    `Cue ${cue.cueNumber} — ${cue.name} and its saved fixture settings will be removed. ` +
                    'The current live lighting state will not be changed.';
            }
    
            showModal(deleteCueModal);
        }
    
        function closeDeleteCueModal() {
            pendingDeleteCueId = null;
            hideModal(deleteCueModal);
            confirmDeleteCueButton?.removeAttribute(
                'disabled'
            );
        }
    
        function confirmDeleteCue() {
            if (!pendingDeleteCueId) {
                return;
            }
    
            const cue =
                getCueById(
                    pendingDeleteCueId
                );
    
            if (
                !cue ||
                isProtectedCue(cue)
            ) {
                closeDeleteCueModal();
                return;
            }
    
            confirmDeleteCueButton?.setAttribute(
                'disabled',
                'true'
            );
    
            try {
                flushLightingCueEdits();
    
                deleteCue(
                    cue.id
                );
    
                closeDeleteCueModal();
            } catch (error) {
                console.error(
                    '[CueList] Delete Cue failed:',
                    error
                );
    
                confirmDeleteCueButton?.removeAttribute(
                    'disabled'
                );
            }
        }

    function applyCueToQuest(cue) {
        if (
            !cue ||
            typeof sendControlMessage !== 'function'
        ) {
            return;
        }

        const fixtureEntries =
            Object.entries(cue.fixtures || {});
        
        setAppliedCueId(cue.id);

        window.dispatchEvent(
            new CustomEvent(
                'cue-playback-state-requested',
                {
                    detail: {
                        cueId: cue.id,
                        cueNumber: cue.cueNumber,
                        requestedAt: Date.now(),
                        expectedDurationMs:
                            Math.max(
                                500,
                                fixtureEntries.length *
                                CUE_FIXTURE_SEND_INTERVAL_MS +
                                CUE_PLAYBACK_SETTLE_MS
                            )
                    }
                }
            )
        );

        sendControlMessage('cue', {
            cue: cue.id,
            cueId: cue.id,
            cueNumber: cue.cueNumber,
            cueName: cue.name
        });

        const validFixtureEntries =
            fixtureEntries.filter(
                ([, snapshot]) => (
                    snapshot &&
                    typeof snapshot === 'object'
                )
            );

        const playbackDurationMs =
            Math.max(
                0,
                validFixtureEntries.length - 1
            ) *
            CUE_FIXTURE_SEND_INTERVAL_MS;

        validFixtureEntries.forEach(
            ([lightId, snapshot], index) => {
                window.setTimeout(() => {
                    sendControlMessage(
                        'lighting-fixture',
                        {
                            ...snapshot,
                            lightId:
                                snapshot.lightId ??
                                Number(lightId)
                        }
                    );
                }, index * CUE_FIXTURE_SEND_INTERVAL_MS);
            }
        );

        window.setTimeout(() => {
            sendControlMessage(
                'request-lighting-state',
                {
                    reason:
                        `cue-${cue.cueNumber}-applied`,
                    requestedAt: Date.now()
                }
            );
        }, playbackDurationMs + CUE_PLAYBACK_SETTLE_MS);
    }

    function createCueRow(cue) {
        const appliedCueId = getAppliedCueId();
        const isSelected =
            String(cue.id) ===
            String(appliedCueId);
        
        const protectedCue =
             isProtectedCue(cue);

        const fixtureCount =
            getFixtureCount(cue);
        
        const row =
            document.createElement('div');

        row.className = 'relative';
        row.dataset.cueRowId =
            String(cue.id);

        const button =
            document.createElement('button');

        button.type = 'button';
        button.dataset.cueId =
            String(cue.id);
        button.className =
            getCueButtonClass(isSelected)+
            (
                protectedCue
                    ? ''
                    : ' pr-20'
            );

        const cueLabel =
            document.createElement('span');

        cueLabel.className = isSelected
            ? 'cue-label text-blue-400'
            : 'cue-label text-gray-400';

        cueLabel.textContent =
            `Cue ${cue.cueNumber}:`;

        const cueName =
            document.createElement('span');

        cueName.className = isSelected
            ? 'cue-name ml-2 text-white font-semibold'
            : 'cue-name ml-2 text-gray-100';

        cueName.textContent =
            String(cue.name || '');

        const fixtureCountLabel =
            document.createElement('div');

        fixtureCountLabel.className =
            'mt-0.5 text-[10px] text-gray-500';

        fixtureCountLabel.textContent =
            getFixtureCountLabel(
                cue,
                fixtureCount
            );

        button.append(
            cueLabel,
            cueName,
            fixtureCountLabel
        );

        button.addEventListener(
            'click',
            () => {
                applyCueToQuest(cue);
            }
        );

        row.appendChild(button);

        // Cue 0 is system-managed: no Rename and no Delete action.
        if (!protectedCue) {
            const actions =
                document.createElement('div');

            actions.className = [
                'absolute',
                'right-2',
                'top-1/2',
                '-translate-y-1/2',
                'flex',
                'items-center',
                'gap-1'
            ].join(' ');

            const renameButton =
                document.createElement('button');

            renameButton.type = 'button';
            renameButton.title =
                `Rename Cue ${cue.cueNumber}`;
            renameButton.setAttribute(
                'aria-label',
                `Rename Cue ${cue.cueNumber}`
            );
            renameButton.className = [
                'w-7',
                'h-7',
                'rounded-md',
                'flex',
                'items-center',
                'justify-center',
                'text-gray-500',
                'hover:text-blue-300',
                'hover:bg-blue-500/10',
                'transition'
            ].join(' ');
            renameButton.innerHTML =
                '<i data-lucide="pencil" class="w-3.5 h-3.5"></i>';

            renameButton.addEventListener(
                'click',
                event => {
                    event.preventDefault();
                    event.stopPropagation();
                    openRenameCueModal(cue);
                }
            );

            const deleteButton =
                document.createElement('button');

            deleteButton.type = 'button';
            deleteButton.title =
                `Delete Cue ${cue.cueNumber}`;
            deleteButton.setAttribute(
                'aria-label',
                `Delete Cue ${cue.cueNumber}`
            );
            deleteButton.className = [
                'w-7',
                'h-7',
                'rounded-md',
                'flex',
                'items-center',
                'justify-center',
                'text-gray-500',
                'hover:text-blue-300',
                'hover:bg-blue-500/10',
                'transition'
            ].join(' ');
            deleteButton.innerHTML =
                '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i>';

            deleteButton.addEventListener(
                'click',
                event => {
                    event.preventDefault();
                    event.stopPropagation();
                    openDeleteCueModal(cue);
                }
            );

            actions.append(
                renameButton,
                deleteButton
            );

            row.appendChild(actions);
        }

        return row;
    }

    function renderCueList() {
        const cues = getCues();

        cueListContainer.innerHTML = '';

        renderRuntimeStatus();

        cues.forEach(cue => {
            cueListContainer.appendChild(
                createCueRow(cue)
            );
        });

        window.lucide?.createIcons();
    }

    cancelRenameCueButton?.addEventListener(
        'click',
        closeRenameCueModal
    );

    confirmRenameCueButton?.addEventListener(
        'click',
        confirmRenameCue
    );

    renameCueNameInput?.addEventListener(
        'keydown',
        event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmRenameCue();
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                closeRenameCueModal();
            }
        }
    );

    cancelDeleteCueButton?.addEventListener(
        'click',
        closeDeleteCueModal
    );

    confirmDeleteCueButton?.addEventListener(
        'click',
        confirmDeleteCue
    );

    [renameCueModal, deleteCueModal].forEach(
        modal => {
            modal?.addEventListener(
                'click',
                event => {
                    if (event.target !== modal) {
                        return;
                    }

                    if (modal === renameCueModal) {
                        closeRenameCueModal();
                    } else {
                        closeDeleteCueModal();
                    }
                }
            );
        }
    );

    window.addEventListener(
        'cue-zero-ready-for-initial-apply',
        event => {
            const cueId =
                event.detail?.cueId;

            const cue =
                cueId
                    ? getCueById(cueId)
                    : null;

            if (cue) {
                applyCueToQuest(cue);
            }
        }
    );

    subscribeCueStore(
        renderCueList,
        {
            emitImmediately: true
        }
    );
}