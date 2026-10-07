export default async ({addon, console, msg}) => {
    // 动态加载 eruda
    const loadScript = src => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    try {
        await loadScript('https://cdn.jsdelivr.net/npm/eruda@3.4.1/eruda.min.js');
        if (window.eruda) {
            window.eruda.init();
            console.log('Eruda 已启动');
        }
    } catch (e) {
        console.error('Eruda 加载失败：', e);
    }
};