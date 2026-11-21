/* eslint-disable no-alert */
const STORAGE_KEY = 'wwh:network-manager';
const TELEMETRY_KEY = 'wwh:disable-telemetry';
const MAX_REQUESTS = 200;

const readConfig = () => {
    try {
        return Object.assign({
            mode: 'allow',
            whitelist: '',
            blacklist: '',
            ask: false,
            telemetryDisabled: localStorage.getItem(TELEMETRY_KEY) === 'true'
        }, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch (e) {
        return {mode: 'allow', whitelist: '', blacklist: '', ask: false, telemetryDisabled: false};
    }
};

const config = readConfig();
const requests = [];
const listeners = new Set();
let nextId = 1;

const emit = () => {
    for (const listener of listeners) listener();
    try {
        window.dispatchEvent(new CustomEvent('wwh-network-update'));
    } catch (e) {
        // Ignore unavailable event APIs in tests.
    }
};

const save = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            mode: config.mode,
            whitelist: config.whitelist,
            blacklist: config.blacklist,
            ask: config.ask
        }));
        localStorage.setItem(TELEMETRY_KEY, config.telemetryDisabled ? 'true' : 'false');
    } catch (e) {
        // Private browsing may disable storage.
    }
};

const parseHosts = value => String(value || '').split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(Boolean);
const hostMatches = (hostname, rules) => rules.some(rule => hostname === rule || hostname.endsWith(`.\u0024{rule}`));

const isTelemetryURL = url => {
    try {
        const parsed = new URL(url, location.href);
        const host = parsed.hostname.toLowerCase();
        return host === 'www.google-analytics.com' ||
            host === 'google-analytics.com' ||
            host.endsWith('.google-analytics.com') ||
            host === 'www.googletagmanager.com' ||
            host.endsWith('.googletagmanager.com') ||
            /telemetry|analytics|tracking/i.test(parsed.pathname);
    } catch (e) {
        return /telemetry|analytics|tracking/i.test(String(url));
    }
};

const shouldAllow = (url, source) => {
    let parsed;
    try {
        parsed = new URL(url, location.href);
    } catch (e) {
        return false;
    }
    if (!['http:', 'https:', 'ws:', 'wss:', 'blob:', 'data:'].includes(parsed.protocol)) return false;
    if (parsed.protocol === 'blob:' || parsed.protocol === 'data:') return true;
    if (config.telemetryDisabled && isTelemetryURL(parsed.href)) return false;
    const host = parsed.hostname.toLowerCase();
    const white = parseHosts(config.whitelist);
    const black = parseHosts(config.blacklist);
    if (config.mode === 'block') return false;
    if (config.mode === 'whitelist' && !hostMatches(host, white)) return false;
    if (config.mode === 'blacklist' && hostMatches(host, black)) return false;
    if (config.ask && source !== 'editor-internal') {
        return window.confirm(`允许网络请求？\n\n${parsed.href}`);
    }
    return true;
};

const record = data => {
    const item = Object.assign({id: nextId++, time: Date.now(), status: 'pending'}, data);
    requests.unshift(item);
    if (requests.length > MAX_REQUESTS) requests.length = MAX_REQUESTS;
    emit();
    return item;
};

const update = (id, values) => {
    const item = requests.find(request => request.id === id);
    if (item) Object.assign(item, values);
    emit();
};

const manager = {
    getConfig: () => Object.assign({}, config),
    getRequests: () => requests.slice(),
    subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    setConfig: values => {
        Object.assign(config, values);
        save();
        emit();
    },
    setTelemetryDisabled: disabled => {
        config.telemetryDisabled = !!disabled;
        save();
        emit();
    },
    clear: () => {
        requests.length = 0;
        emit();
    },
    authorize: (url, source) => shouldAllow(url, source || 'vm'),
    record
};

if (typeof window !== 'undefined' && !window.__wwhNetworkManager) {
    window.__wwhNetworkManager = manager;

    const nativeFetch = window.fetch && window.fetch.bind(window);
    if (nativeFetch) {
        window.fetch = async (input, init) => {
            const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
            const method = (init && init.method) || (input && input.method) || 'GET';
            const item = record({url, method: String(method).toUpperCase(), source: 'fetch'});
            if (!shouldAllow(url, 'fetch')) {
                update(item.id, {status: 'blocked'});
                throw new TypeError(`Network request blocked by TurboWarp network manager: ${url}`);
            }
            try {
                const response = await nativeFetch(input, init);
                update(item.id, {status: response.ok ? 'success' : 'http-error', statusCode: response.status});
                return response;
            } catch (error) {
                update(item.id, {status: 'error', error: String(error)});
                throw error;
            }
        };
    }

    const NativeXHR = window.XMLHttpRequest;
    if (NativeXHR) {
        window.XMLHttpRequest = class ManagedXHR extends NativeXHR {
            open(method, url, ...args) {
                this.__wwhRequest = {method: String(method || 'GET').toUpperCase(), url: String(url)};
                return super.open(method, url, ...args);
            }
            send(...args) {
                const info = this.__wwhRequest || {method: 'GET', url: ''};
                const item = record(Object.assign({}, info, {source: 'xhr'}));
                if (!shouldAllow(info.url, 'xhr')) {
                    update(item.id, {status: 'blocked'});
                    throw new DOMException('Blocked by TurboWarp network manager', 'NetworkError');
                }
                this.addEventListener('loadend', () => {
                    update(item.id, {
                        status: this.status >= 200 && this.status < 400 ? 'success' : 'http-error',
                        statusCode: this.status
                    });
                }, {once: true});
                this.addEventListener('error', () => update(item.id, {status: 'error'}), {once: true});
                return super.send(...args);
            }
        };
    }

    if (navigator.sendBeacon) {
        const nativeBeacon = navigator.sendBeacon.bind(navigator);
        navigator.sendBeacon = (url, data) => {
            const item = record({url: String(url), method: 'BEACON', source: 'sendBeacon'});
            if (!shouldAllow(url, 'sendBeacon')) {
                update(item.id, {status: 'blocked'});
                return false;
            }
            const result = nativeBeacon(url, data);
            update(item.id, {status: result ? 'queued' : 'error'});
            return result;
        };
    }
}

export default manager;
