export default async ({addon, console}) => {
    const getSizes = () => {
        const editorMaxHeight = parseInt(addon.settings.get('editorMaxHeight'), 10) || 320;
        const targetMaxHeight = parseInt(addon.settings.get('targetMaxHeight'), 10) || 80;
        return {
            editorMaxHeight: `${editorMaxHeight}px`,
            targetMaxHeight: `${targetMaxHeight}px`
        };
    };

    let isSqueezed = false;
    let savedEditor = null;
    let savedTarget = null;

    const findEl = partialClass => document.querySelector(`[class*="${partialClass}"]`);

    const squeeze = () => {
        if (isSqueezed) return;
        const sizes = getSizes();
        const editor = findEl('gui_editor-wrapper');
        const target = findEl('gui_target-wrapper');

        if (editor) {
            savedEditor = {
                maxHeight: editor.style.maxHeight,
                overflow: editor.style.overflow
            };
            editor.style.maxHeight = sizes.editorMaxHeight;
            editor.style.overflow = 'hidden';
        }
        if (target) {
            savedTarget = {
                maxHeight: target.style.maxHeight,
                overflow: target.style.overflow
            };
            target.style.maxHeight = sizes.targetMaxHeight;
            target.style.overflow = 'auto';
        }
        isSqueezed = true;
    };

    const restore = () => {
        if (!isSqueezed) return;
        const editor = findEl('gui_editor-wrapper');
        const target = findEl('gui_target-wrapper');

        if (editor && savedEditor) {
            editor.style.maxHeight = savedEditor.maxHeight;
            editor.style.overflow = savedEditor.overflow;
        }
        if (target && savedTarget) {
            target.style.maxHeight = savedTarget.maxHeight;
            target.style.overflow = savedTarget.overflow;
        }
        savedEditor = null;
        savedTarget = null;
        isSqueezed = false;
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
            squeeze();
            button.style.display = 'none';
        } else {
            restore();
            button.style.display = 'flex';
        }
    };

    button.addEventListener('click', toggle);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.body.appendChild(button);

    addon.self.addEventListener('disabled', () => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        restore();
        if (button.parentNode) button.parentNode.removeChild(button);
    });
};
