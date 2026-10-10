/**
 * 全局保存状态。用于 SB3Downloader 组件可能被卸载时，
 * 横幅仍然能正常显示进度。
 */

const listeners = new Set();

let currentStatus = {
    state: 'idle',
    progress: 0,
    error: null
};

const notify = () => {
    for (const listener of listeners) {
        listener(currentStatus);
    }
};

const setSaveStatus = (state, progress = 0, error = null) => {
    currentStatus = {state, progress, error};
    notify();
};

const getSaveStatus = () => currentStatus;

const subscribeSaveStatus = listener => {
    listeners.add(listener);
    listener(currentStatus);
    return () => {
        listeners.delete(listener);
    };
};

export {setSaveStatus, getSaveStatus, subscribeSaveStatus};
