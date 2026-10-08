export default async ({addon, console}) => {
    const SYNC_FLAG = 'wwh:net-synced-this-session';

    const readSettings = () => ({
        mode: addon.settings.get('mode') || 'allow',
        whitelist: addon.settings.get('whitelist') || '',
        blacklist: addon.settings.get('blacklist') || '',
        ask: !!addon.settings.get('ask')
    });

    const syncToLocalStorage = cfg => {
        localStorage.setItem('wwh:net-mode', cfg.mode);
        localStorage.setItem('wwh:net-whitelist', cfg.whitelist);
        localStorage.setItem('wwh:net-blacklist', cfg.blacklist);
        localStorage.setItem('wwh:net-ask', cfg.ask ? 'true' : 'false');
    };

    const readLocalStorage = () => ({
        mode: localStorage.getItem('wwh:net-mode') || '',
        whitelist: localStorage.getItem('wwh:net-whitelist') || '',
        blacklist: localStorage.getItem('wwh:net-blacklist') || '',
        ask: localStorage.getItem('wwh:net-ask') === 'true'
    });

    const cfg = readSettings();
    const stored = readLocalStorage();

    const same = (
        cfg.mode === stored.mode &&
        cfg.whitelist === stored.whitelist &&
        cfg.blacklist === stored.blacklist &&
        cfg.ask === stored.ask
    );

    if (!same && !sessionStorage.getItem(SYNC_FLAG)) {
        // 设置和 localStorage 不一致，同步并刷新一次，让 index.ejs 用新配置拦截
        console.log('[WWHWarp/NetworkPolicy] 同步配置并刷新');
        syncToLocalStorage(cfg);
        sessionStorage.setItem(SYNC_FLAG, '1');
        location.reload();
        return;
    }

    // 已同步，仅写入（不刷新）
    syncToLocalStorage(cfg);
    console.log('[WWHWarp/NetworkPolicy] Active. Mode:', cfg.mode);
};