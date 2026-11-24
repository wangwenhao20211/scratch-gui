const DEFAULTS = {show: true, corner: 'br', text: '', sound: true},
    LINES = ['喵～', '泡泡！', '今天也加油', '别戳我啦'],
    KEY = 'sa-whale-widget-corner',
    CORNERS = ['br', 'bl', 'tr', 'tl'];
function svg() {
    return '<svg viewBox="0 0 128 110" aria-hidden="true"><ellipse cx="60" cy="64" rx="46" ry="30" fill="#5791ed"/><ellipse cx="56" cy="79" rx="34" ry="13" fill="#d5e6ff"/><circle cx="45" cy="55" r="5.6" fill="#13233f"/><circle cx="47" cy="53" r="1.8" fill="#fff"/></svg>';
}
export default async function ({addon} = {}) {
    const id = 'sa-whale-widget-root';
    if (document.getElementById(id)) return;
    const get = k => {
        try {
            const v = addon?.settings?.get(k);
            return v == null ? DEFAULTS[k] : v;
        } catch (e) {
            return DEFAULTS[k];
        }
    };
    const root = document.createElement('div');
    root.id = id;
    root.className = 'sa-whale';
    const bubble = document.createElement('div');
    bubble.className = 'sa-whale-bubble';
    bubble.setAttribute('role', 'status');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-whale-body';
    btn.setAttribute('aria-label', '鲸鱼挂件');
    const fallback = document.createElement('span');
    fallback.className = 'sa-whale-fallback';
    fallback.innerHTML = svg();
    btn.append(fallback);
    root.append(bubble, btn);
    document.body.append(root);
    let hide = 0,
        pet = 0,
        drag = null,
        justDragged = false,
        last = '',
        destroyed = false;
    const audio = {};
    const cssUrl = name => {
        const v = getComputedStyle(root).getPropertyValue(name),
            m = /url\(["']?([^"')]+)["']?\)/.exec(v);
        return m?.[1] || '';
    };
    const sound = kind => {
        if (!get('sound')) return;
        const url = cssUrl(kind === 'press' ? '--press' : '--click');
        if (!url) return;
        try {
            audio[kind] ??= new Audio(url);
            audio[kind].currentTime = 0;
            audio[kind].volume = 0.35;
            audio[kind].play().catch(() => {});
        } catch (e) {}
    };
    const stored = () => {
        try {
            const v = localStorage.getItem(KEY);
            return CORNERS.includes(v) ? v : '';
        } catch (e) {
            return '';
        }
    };
    const say = t => {
        bubble.textContent = t;
        bubble.classList.add('sa-whale-bubble--on');
        clearTimeout(hide);
        hide = setTimeout(() => bubble.classList.remove('sa-whale-bubble--on'), 3200);
    };
    const poke = () => {
        sound('click');
        say(
            String(get('text') || '').trim() ||
                (() => {
                    let n = last;
                    while (n === last) n = LINES[(Math.random() * LINES.length) | 0];
                    return (last = n);
                })()
        );
        const url = cssUrl('--poke');
        if (url) {
            root.querySelector('.sa-whale-pet')?.remove();
            const img = new Image();
            img.className = 'sa-whale-pet';
            img.src = url;
            root.append(img);
            clearTimeout(pet);
            pet = setTimeout(() => img.remove(), 1600);
        }
    };
    const nearest = () => {
        const r = root.getBoundingClientRect();
        return (
            (r.top + r.height / 2 > innerHeight / 2 ? 'b' : 't') + (r.left + r.width / 2 > innerWidth / 2 ? 'r' : 'l')
        );
    };
    const down = e => {
        if (e.button !== undefined && e.button !== 0) return;
        drag = {x: e.clientX, y: e.clientY, moved: false};
        justDragged = false;
        try {
            btn.setPointerCapture(e.pointerId);
        } catch (x) {}
        root.classList.add('sa-whale--dragging');
        sound('press');
    };
    const move = e => {
        if (!drag) return;
        const x = e.clientX - drag.x,
            y = e.clientY - drag.y;
        if (Math.hypot(x, y) > 5) drag.moved = true;
        if (drag.moved) root.style.translate = x + 'px ' + y + 'px';
    };
    const up = e => {
        if (!drag) return;
        const moved = drag.moved;
        drag = null;
        try {
            btn.releasePointerCapture(e.pointerId);
        } catch (x) {}
        root.classList.remove('sa-whale--dragging');
        if (moved) {
            justDragged = true;
            const c = nearest();
            root.dataset.corner = c;
            try {
                localStorage.setItem(KEY, c);
            } catch (x) {}
        }
        root.style.translate = '';
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointermove', move);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('click', () => {
        if (justDragged) {
            justDragged = false;
            return;
        }
        poke();
    });
    let configured = get('corner');
    const apply = () => {
        root.hidden = get('show') === false;
        const c = CORNERS.includes(get('corner')) ? get('corner') : 'br';
        if (!root.dataset.corner) root.dataset.corner = stored() || c;
    };
    apply();
    const settingsChange = () => {
        const c = get('corner');
        if (c !== configured) {
            configured = c;
            try {
                localStorage.removeItem(KEY);
            } catch (e) {}
            root.dataset.corner = CORNERS.includes(c) ? c : 'br';
        }
        apply();
    };
    addon?.settings?.addEventListener?.('change', settingsChange);
    const onDisable = () => {
        root.hidden = true;
        clearTimeout(hide);
        clearTimeout(pet);
        bubble.classList.remove('sa-whale-bubble--on');
        root.querySelector('.sa-whale-pet')?.remove();
        Object.values(audio).forEach(a => {
            a.pause();
            a.currentTime = 0;
        });
    };
    const onEnable = apply;
    addon?.self?.addEventListener?.('disabled', onDisable);
    addon?.self?.addEventListener?.('reenabled', onEnable);
    const probe = new Image();
    probe.onerror = () => root.classList.add('sa-whale--fallback');
    probe.src = getComputedStyle(btn).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || '';
}
