export function setupSidebar() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageViews = document.querySelectorAll('.page-view');

    function renderSidebarUI(activeTargetId) {
        navButtons.forEach(btn => {
            const targetId = btn.getAttribute('data-target');
            const isBtnActive = targetId === activeTargetId;

            const icon = btn.querySelector('svg') || btn.querySelector('i');
            const span = btn.querySelector('span');
            const indicator = btn.querySelector('.indicator');

            if (isBtnActive) {
                btn.className = 'nav-btn w-full py-2.5 flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer text-blue-400';
                if (icon) icon.setAttribute('class', 'lucide w-4 h-4 mb-1.5 text-blue-400 transition-colors');
                if (span) span.className = 'w-full text-[10px] font-medium tracking-wide text-center leading-normal text-blue-400 block px-1';
                if (indicator) indicator.className = 'indicator absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 shadow-[0_0_10px_#3b82f6]';
            } else {
                btn.className = 'nav-btn w-full py-2.5 flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer text-gray-500 hover:text-gray-300';
                if (icon) icon.setAttribute('class', 'lucide w-4 h-4 mb-1.5 text-gray-500 transition-colors');
                if (span) span.className = 'w-full text-[10px] font-medium tracking-wide text-center leading-normal text-gray-500 block px-1';
                if (indicator) indicator.className = 'indicator absolute left-0 top-0 bottom-0 w-[3px] bg-transparent';
            }
        });
    }

    renderSidebarUI('page-status');

    navButtons.forEach(button => {
        button.addEventListener('click', event => {
            const currentBtn = event.target.closest('.nav-btn');
            if (!currentBtn) return;

            const targetPageId = currentBtn.getAttribute('data-target');

            pageViews.forEach(page => page.classList.add('hidden'));
            document.getElementById(targetPageId)?.classList.remove('hidden');

            renderSidebarUI(targetPageId);
        });
    });
}