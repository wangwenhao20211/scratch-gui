import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import log from '../lib/log';
import bindAll from 'lodash.bindall';
import SecurityManagerModal from '../components/tw-security-manager-modal/security-manager-modal.jsx';
import SecurityModals from '../lib/tw-security-manager-constants';
import {getPersistedUnsandboxed, setPersistedUnsandboxed} from '../lib/tw-persisted-unsandboxed.js';

/* eslint-disable require-atomic-updates */

/**
 * 全局“信任所有扩展”开关的 localStorage 键
 */
const TRUST_ALL_KEY = 'tw:trust_all_extensions';

/**
 * @returns {boolean} 全局信任开关是否开启
 */
const isTrustAllEnabled = () => {
    try {
        return localStorage.getItem(TRUST_ALL_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

/**
 * @param {boolean} enabled 是否开启
 */
const setTrustAllEnabled = enabled => {
    try {
        if (enabled) {
            localStorage.setItem(TRUST_ALL_KEY, 'true');
        } else {
            localStorage.removeItem(TRUST_ALL_KEY);
        }
    } catch (e) {
        // ignore
    }
};

/**
 * Set of extension URLs that the user has manually trusted to load unsandboxed.
 */
const extensionsTrustedByUser = new Set();

const manuallyTrustExtension = url => {
    extensionsTrustedByUser.add(url);
};

/**
 * Trusted extensions are loaded automatically and without a sandbox.
 * @param {string} url URL as a string.
 * @returns {boolean} True if the extension can is trusted
 */
const isTrustedExtension = url => (
    // 全局“信任所有扩展”开关开启时，一切扩展都视为可信
    isTrustAllEnabled() ||

    // Always trust our official extension repostiory.
    url.startsWith('https://extensions.turbowarp.org/') ||

    url.startsWith('https://turbowarp-extensions.pages.dev/') ||

    // For development.
    url.startsWith('http://localhost:8000/') ||

    extensionsTrustedByUser.has(url)
);

/**
 * Set of fetch resource hosts that were manually trusted by the user.
 * @type {Set<string>}
 */
const fetchHostsTrustedByUser = new Set();

/**
 * Set of hosts manually trusted by the user for embedding.
 * @type {Set<string>}
 */
const embedHostsTrustedByUser = new Set();

/**
 * @param {URL} parsed Parsed URL object
 * @returns {boolean} True if path is untrusted.
 */
const isUntrustedPath = parsed => (
    /^\/cdn-cgi\//i.test(parsed.pathname)
);

/**
 * @param {URL} parsed Parsed URL object
 * @returns {boolean} True if the URL is part of the builtin set of URLs to always trust fetching from.
 */
const isAlwaysTrustedForFetching = parsed => (
    isTrustedExtension(parsed.href) ||

    parsed.origin === 'https://turbowarp.org' ||
    parsed.origin.endsWith('.turbowarp.org') ||
    parsed.origin.endsWith('.turbowarp.xyz') ||

    parsed.origin === 'https://raw.githubusercontent.com' ||
    parsed.origin === 'https://gist.githubusercontent.com' ||
    parsed.origin === 'https://api.github.com' ||

    parsed.origin === 'https://gitlab.com' ||

    parsed.origin.endsWith('.srht.site') ||

    parsed.origin === 'https://api.gamejolt.com'
);

const FETCHABLE_PROTOCOLS = [
    'http:',
    'https:',
    'data:',
    'blob:',
    'ws:',
    'wss:'
];

const VISITABLE_PROTOCOLS = [
    'http:',
    'https:',
    'data:',
    'blob:',
    'mailto:',
    'steam:',
    'calculator:'
];

/**
 * @param {string} url Original URL string
 * @param {string[]} protocols List of allowed protocols
 * @returns {URL|null} A URL object if it is valid and of a known protocol, otherwise null.
 */
const parseURL = (url, protocols) => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return null;
    }
    if (!protocols.includes(parsed.protocol)) {
        return null;
    }
    return parsed;
};

let allowedAudio = false;
let allowedVideo = false;
let allowedReadClipboard = false;
let allowedNotify = false;
let allowedGeolocation = false;

const SECURITY_MANAGER_METHODS = [
    'getSandboxMode',
    'canLoadExtensionFromProject',
    'canFetch',
    'canOpenWindow',
    'canRedirect',
    'canRecordAudio',
    'canRecordVideo',
    'canReadClipboard',
    'canNotify',
    'canGeolocate',
    'canEmbed',
    'canDownload'
];

class TWSecurityManagerComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAllowed',
            'handleDenied'
        ]);
        bindAll(this, SECURITY_MANAGER_METHODS);
        this.nextModalCallbacks = [];
        this.modalLocked = false;
        this.state = {
            type: null,
            data: null,
            callback: null,
            modalCount: 0
        };
    }

    componentDidMount () {
        const vmSecurityManager = this.props.vm.extensionManager.securityManager;
        const propsSecurityManager = this.props.securityManager;
        for (const method of SECURITY_MANAGER_METHODS) {
            vmSecurityManager[method] = propsSecurityManager[method] || this[method];
        }
    }

    async acquireModalLock () {
        if (this.modalLocked) {
            await new Promise(resolve => {
                this.nextModalCallbacks.push(resolve);
            });
        } else {
            this.modalLocked = true;
        }

        const releaseLock = () => {
            if (this.nextModalCallbacks.length) {
                const nextModalCallback = this.nextModalCallbacks.shift();
                nextModalCallback();
            } else {
                this.modalLocked = false;
                this.setState({
                    type: null
                });
            }
        };

        const showModal = async (type, data) => {
            const result = await new Promise(resolve => {
                this.setState(oldState => ({
                    type,
                    data,
                    callback: resolve,
                    modalCount: oldState.modalCount + 1
                }));
            });
            releaseLock();
            return result;
        };

        return {
            showModal,
            releaseLock
        };
    }

    handleAllowed () {
        this.state.callback(true);
    }

    handleDenied () {
        this.state.callback(false);
    }

    /**
     * @param {string} url The extension's URL
     * @returns {string} The VM worker mode to use
     */
    getSandboxMode (url) {
        if (isTrustedExtension(url)) {
            log.info(`Loading extension ${url} unsandboxed`);
            return 'unsandboxed';
        }
        return 'iframe';
    }

    handleChangeUnsandboxed (e) {
        const checked = e.target.checked;
        this.setState(oldState => ({
            data: {
                ...oldState.data,
                unsandboxed: checked
            }
        }));
    }

    /**
     * @param {string} url The extension's URL
     * @returns {Promise<boolean>} Whether the extension can be loaded
     */
    async canLoadExtensionFromProject (url) {
        if (isTrustedExtension(url)) {
            log.info(`Loading extension ${url} automatically`);
            return true;
        }

        const {showModal} = await this.acquireModalLock();

        if (url.startsWith('data:')) {
            const allowed = await showModal(SecurityModals.LoadExtension, {
                url,
                unsandboxed: getPersistedUnsandboxed(),
                onChangeUnsandboxed: this.handleChangeUnsandboxed.bind(this)
            });
            if (allowed) {
                setPersistedUnsandboxed(this.state.data.unsandboxed);
            }
            if (allowed && this.state.data.unsandboxed) {
                manuallyTrustExtension(url);
            }
            return allowed;
        }

        return showModal(SecurityModals.LoadExtension, {
            url,
            unsandboxed: false
        });
    }

    async canFetch (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) {
            return false;
        }
        if (isAlwaysTrustedForFetching(parsed)) {
            return !isUntrustedPath(parsed);
        }
        const {showModal, releaseLock} = await this.acquireModalLock();
        const host = (
            parsed.protocol === 'http:' ||
            parsed.protocol === 'https:' ||
            parsed.protocol === 'ws:' ||
            parsed.protocol === 'wss:'
        ) ? parsed.host : null;
        if (host && fetchHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Fetch, {
            url
        });
        if (host && allowed) {
            fetchHostsTrustedByUser.add(host);
        }
        return allowed;
    }

    async canOpenWindow (url) {
        const parsed = parseURL(url, VISITABLE_PROTOCOLS);
        if (!parsed) {
            return false;
        }
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.OpenWindow, {
            url
        });
    }

    async canRedirect (url) {
        const parsed = parseURL(url, VISITABLE_PROTOCOLS);
        if (!parsed) {
            return false;
        }
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Redirect, {
            url
        });
    }

    async canRecordAudio () {
        if (!allowedAudio) {
            const {showModal} = await this.acquireModalLock();
            allowedAudio = await showModal(SecurityModals.RecordAudio);
        }
        return allowedAudio;
    }

    async canRecordVideo () {
        if (!allowedVideo) {
            const {showModal} = await this.acquireModalLock();
            allowedVideo = await showModal(SecurityModals.RecordVideo);
        }
        return allowedVideo;
    }

    async canReadClipboard () {
        if (!allowedReadClipboard) {
            const {showModal} = await this.acquireModalLock();
            allowedReadClipboard = await showModal(SecurityModals.ReadClipboard);
        }
        return allowedReadClipboard;
    }

    async canNotify () {
        if (!allowedNotify) {
            const {showModal} = await this.acquireModalLock();
            allowedNotify = await showModal(SecurityModals.Notify);
        }
        return allowedNotify;
    }

    async canGeolocate () {
        if (!allowedGeolocation) {
            const {showModal} = await this.acquireModalLock();
            allowedGeolocation = await showModal(SecurityModals.Geolocate);
        }
        return allowedGeolocation;
    }

    async canEmbed (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) {
            return false;
        }
        const host = (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.host : null;
        const {showModal, releaseLock} = await this.acquireModalLock();
        if (host && embedHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Embed, {url});
        if (host && allowed) {
            embedHostsTrustedByUser.add(host);
        }
        return allowed;
    }

    async canDownload (url, name) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) {
            return false;
        }
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Download, {
            url,
            name
        });
    }

    render () {
        if (this.state.type) {
            return (
                <SecurityManagerModal
                    type={this.state.type}
                    data={this.state.data}
                    onAllowed={this.handleAllowed}
                    onDenied={this.handleDenied}
                    key={this.state.modalCount}
                />
            );
        }
        return null;
    }
}

TWSecurityManagerComponent.propTypes = {
    vm: PropTypes.shape({
        extensionManager: PropTypes.shape({
            securityManager: PropTypes.shape(
                SECURITY_MANAGER_METHODS.reduce((obj, method) => {
                    obj[method] = PropTypes.func.isRequired;
                    return obj;
                }, {})
            ).isRequired
        }).isRequired
    }).isRequired,
    securityManager: PropTypes.shape(Object.fromEntries(SECURITY_MANAGER_METHODS.map(i => [i, PropTypes.func])))
};

TWSecurityManagerComponent.defaultProps = {
    securityManager: {}
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = () => ({});

const ConnectedSecurityManagerComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSecurityManagerComponent);

export {
    ConnectedSecurityManagerComponent as default,
    manuallyTrustExtension,
    isTrustedExtension,
    isTrustAllEnabled,
    setTrustAllEnabled
};