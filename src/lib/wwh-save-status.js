const listeners = new Set();

let currentStatus = {
    state: 'idle',
    progress: 0,
    error: null,
    currentFile: null
};

const notify = () => {
    for (const listener of listeners) {
        listener(currentStatus);
    }
};

const setSaveStatus = (state, progress = 0, error = null, currentFile = null) => {
    currentStatus = {state, progress, error, currentFile};
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

export {
    setSaveStatus,
    getSaveStatus,
    subscribeSaveStatus
};