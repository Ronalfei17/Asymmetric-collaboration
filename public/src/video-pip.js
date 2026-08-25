let pipClosedForCurrentVisit = false;
let activePageId = 'page-status';

function getElement(id) {
    return document.getElementById(id);
}

function getViewport() {
    return getElement('vrStreamViewport');
}

function getHomeSlot() {
    return getElement('vrStreamHomeSlot');
}

function getPip() {
    return getElement('lightingVideoPip');
}

function getPipSlot() {
    return getElement('lightingVideoPipSlot');
}

function getRightColumn() {
    return getElement('lightingDetailRightColumn');
}

function positionPip() {
    const pip = getPip();
    const rightColumn = getRightColumn();

    if (!pip || !rightColumn) {
        return;
    }

    const rect = rightColumn.getBoundingClientRect();

    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {
        return;
    }

    pip.style.width = `${rect.width}px`;

    pip.style.left = `${rect.left}px`;

    pip.style.bottom = '16px';

    pip.style.height = 'auto';
}

function moveViewportToPip() {
    const viewport = getViewport();
    const pipSlot = getPipSlot();
    const pip = getPip();

    if (
        !viewport ||
        !pipSlot ||
        !pip
    ) {
        return;
    }

    pipSlot.appendChild(viewport);

    viewport.classList.remove(
        'h-full'
    );

    viewport.classList.add(
        'w-full',
        'h-full'
    );

    pip.classList.remove('hidden');

    positionPip();

    window.requestAnimationFrame(() => {
        getElement('remoteVideo')
            ?.play()
            .catch(() => {});
    });
}

function moveViewportHome() {
    const viewport = getViewport();
    const homeSlot = getHomeSlot();
    const pip = getPip();

    if (
        !viewport ||
        !homeSlot
    ) {
        return;
    }

    homeSlot.appendChild(viewport);

    viewport.classList.add(
        'w-full',
        'h-full'
    );

    pip?.classList.add('hidden');

    window.requestAnimationFrame(() => {
        getElement('remoteVideo')
            ?.play()
            .catch(() => {});
    });
}

function showLightingPip() {
    if (
        activePageId !== 'page-light' ||
        pipClosedForCurrentVisit
    ) {
        return;
    }

    moveViewportToPip();
}

function hideLightingPip({
    returnHome = true
} = {}) {
    const pip = getPip();

    pip?.classList.add('hidden');

    if (returnHome) {
        moveViewportHome();
    }
}

function handlePageChanged(pageId) {
    const previousPageId = activePageId;
    activePageId = pageId;

    if (pageId === 'page-light') {
        if (previousPageId !== 'page-light') {
            pipClosedForCurrentVisit = false;
        }

        showLightingPip();
        return;
    }

    moveViewportHome();
}

export function setupVideoPip() {
    const closeButton =
        getElement('lightingVideoPipClose');

    closeButton?.addEventListener(
        'click',
        event => {
            event.preventDefault();
            event.stopPropagation();

            pipClosedForCurrentVisit = true;

            moveViewportHome();
        }
    );

    window.addEventListener(
        'app-page-changed',
        event => {
            const pageId =
                event.detail?.pageId;

            if (!pageId) return;

            handlePageChanged(pageId);
        }
    );

    window.addEventListener(
        'resize',
        () => {
            if (
                activePageId === 'page-light' &&
                !pipClosedForCurrentVisit
            ) {
                positionPip();
            }
        }
    );

    window.visualViewport?.addEventListener(
        'resize',
        () => {
            if (
                activePageId === 'page-light' &&
                !pipClosedForCurrentVisit
            ) {
                positionPip();
            }
        }
    );
}