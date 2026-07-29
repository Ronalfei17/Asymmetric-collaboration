import { getCues, subscribeCueStore } from './cue-store.js';

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

    // Cue 0 stores the complete Unity baseline, including OFF fixtures.
    // Only the homepage count is based on isOn=true.
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

        // Mark the whole playback window before sending any fixture payload.
        // Unity may emit one or more snapshots while the Cue is being applied.
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
            // Rebuilding Cue 0 should not override a Cue the user just selected.
            // Only an explicit initial/reconnect baseline may reset the selection.
            if (event.detail?.resetSelection === true) {
                selectedCueId =
                    event.detail?.cueId ||
                    getCues().find(
                        cue =>
                            Number(cue.cueNumber) === 0
                    )?.id ||
                    null;
            }

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