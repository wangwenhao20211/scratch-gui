export default async ({addon, console}) => {
    const MIN_WIDTH = 1100;

    const applyZoom = () => {
        const available = window.innerWidth;
        if (available < MIN_WIDTH) {
            document.documentElement.style.zoom = (available / MIN_WIDTH).toString();
        } else {
            document.documentElement.style.zoom = '';
        }
    };

    const removeZoom = () => {
        document.documentElement.style.zoom = '';
    };

    const button = document.createElement('button');
    button.title = '全屏';
    button.innerHTML =
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
    button.style.cssText = [
        'position:fixed',
        'right:12px',
        'top:50%',
        'transform:translateY(-50%)',
        'width:44px',
        'height:44px',
        'border-radius:50%',
        'border:none',
        'background:rgba(76,151,255,.9)',
        'color:#fff',
        'cursor:pointer',
        'z-index:100000',
        'box-shadow:0 2px 8px rgba(0,0,0,.25)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:0',
        '-webkit-tap-highlight-color:transparent'
    ].join(';');

    const toggle = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                try {
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                } catch (e) {
                    /* ignore */
                }
            } else {
                await document.documentElement.requestFullscreen();
                try {
                    if (screen.orientation && screen.orientation.lock) {
                        await screen.orientation.lock('landscape');
                    }
                } catch (e) {
                    /* ignore */
                }
            }
        } catch (e) {
            console.error('Fullscreen toggle failed:', e);
        }
    };

    const onFullscreenChange = () => {
        if (document.fullscreenElement) {
            applyZoom();
            button.style.display = 'none';
        } else {
            removeZoom();
            button.style.display = 'flex';
        }
    };

    const onResize = () => {
        if (document.fullscreenElement) {
            applyZoom();
        }
    };

    button.addEventListener('click', toggle);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('resize', onResize);
    document.body.appendChild(button);

    // dynamicDisable 是 false，所以不需要清理。但如果用户手动关闭，这里作为保险：
    addon.self.addEventListener('disabled', () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        window.removeEventListener('resize', onResize);
        removeZoom();
        if (button.parentNode) button.parentNode.removeChild(button);
    });
};
