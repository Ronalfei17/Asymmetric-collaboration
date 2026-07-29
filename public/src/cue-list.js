import { getCues, subscribeCueStore } from './cue-store.js';

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

function getFixtureCount(cue) {
    return Object.keys(
        cue?.fixtures || {}
    ).length;
}

export function setupCueList(sendControlMessage) {
    const initialCueButtons = document.querySelectorAll('.cue-btn');
    const cueListContainer = initialCueButtons[0]?.parentElement || document.getElementById('homeCueList');

    let selectedCueId = 'cue-0';
    if (!cueListContainer) {
        console.warn(
            '[CueList] Cue List container not found.'
        );
        return;
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

        sendControlMessage('cue', {
            cue: cue.id,
            cueId: cue.id,
            cueNumber: cue.cueNumber,
            cueName: cue.name
        });

        fixtureEntries.forEach(
            ([lightId, snapshot]) => {
                if (
                    !snapshot ||
                    typeof snapshot !== 'object'
                ) {
                    return;
                }

                sendControlMessage(
                    'lighting-fixture',
                    {
                        ...snapshot,
                        lightId:
                            snapshot.lightId ??
                            Number(lightId)
                    }
                );
            }
        );

        window.setTimeout(() => {
            window.dispatchEvent(
                new CustomEvent(
                    'cue-playback-state-requested',
                    {
                        detail: {
                            cueId: cue.id,
                            cueNumber: cue.cueNumber
                        }
                    }
                )
            );

            sendControlMessage(
                'request-lighting-state',
                {
                    reason:
                        `cue-${cue.cueNumber}-applied`,
                    requestedAt: Date.now()
                }
            );
        }, 150);
    }

    function createCueButton(cue) {
        const isSelected =
            String(cue.id) ===
            String(selectedCueId);

        const fixtureCount =
            getFixtureCount(cue);

        const button =
            document.createElement('button');

        button.type = 'button';
        button.dataset.cueId =
            String(cue.id);
        button.className =
            getCueButtonClass(isSelected);

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
            `${fixtureCount} fixture` +
            `${fixtureCount === 1 ? '' : 's'}`;

        button.append(
            cueLabel,
            cueName,
            fixtureCountLabel
        );

        button.addEventListener(
            'click',
            () => {
                selectedCueId = cue.id;

                renderCueList();
                applyCueToQuest(cue);
            }
        );

        return button;
    }

    function renderCueList() {
        const cues = getCues();

        if (
            !selectedCueId ||
            !cues.some(
                cue =>
                    String(cue.id) ===
                    String(selectedCueId)
            )
        ) {
            selectedCueId =
                cues.find(
                    cue =>
                        Number(cue.cueNumber) === 0
                )?.id ??
                cues[0]?.id ??
                null;
        }

        cueListContainer.innerHTML = '';

        if (cues.length === 0) {
            const emptyState =
                document.createElement('div');

            emptyState.className =
                'rounded-lg border border-dashed border-gray-700 p-4 text-center text-[11px] text-gray-500';

            emptyState.textContent =
                'No Cues created yet.';

            cueListContainer.appendChild(
                emptyState
            );

            return;
        }

        cues.forEach(cue => {
            cueListContainer.appendChild(
                createCueButton(cue)
            );
        });
    }

    window.addEventListener(
        'cue-zero-refreshed',
        event => {
            selectedCueId =
                event.detail?.cueId ||
                getCues().find(
                    cue =>
                        Number(cue.cueNumber) === 0
                )?.id ||
                null;

            renderCueList();
        }
    );

    subscribeCueStore(
        renderCueList,
        {
            emitImmediately: true
        }
    );
}