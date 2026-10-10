import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import SaveBanner from './save-banner.jsx';
import {subscribeSaveStatus, setSaveStatus} from '../../lib/wwh-save-status.js';

const SaveBannerContainer = () => {
    const [status, setStatus] = useState({
        state: 'idle',
        progress: 0,
        error: null,
        currentFile: null
    });

    useEffect(() => {
        const unsubscribe = subscribeSaveStatus(setStatus);
        return unsubscribe;
    }, []);

    return createPortal(
        <SaveBanner
            state={status.state}
            progress={status.progress}
            currentFile={status.currentFile}
            errorMessage={status.error}
            onDismiss={() => setSaveStatus('idle', 0, null, null)}
        />,
        document.body
    );
};

export default SaveBannerContainer;
