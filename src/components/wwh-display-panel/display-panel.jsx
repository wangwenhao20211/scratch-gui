import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import styles from './display-panel.css';

const ENABLED_KEY = 'wwh:viewport-scale-enabled';
const WIDTH_KEY = 'wwh:viewport-width';

const readEnabled = () => {
    try {
        return localStorage.getItem(ENABLED_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

const readWidth = () => {
    try {
        return localStorage.getItem(WIDTH_KEY) || '1100';
    } catch (e) {
        return '1100';
    }
};

const DisplayPanel = props => {
    const [enabled, setEnabled] = React.useState(readEnabled);
    const [width, setWidth] = React.useState(readWidth);
    const [dirty, setDirty] = React.useState(false);

    const handleToggle = e => {
        const v = e.target.checked;
        try {
            localStorage.setItem(ENABLED_KEY, v ? 'true' : 'false');
        } catch (err) { /* ignore */ }
        setEnabled(v);
        setDirty(true);
    };

    const handleWidthChange = e => {
        setWidth(e.target.value);
    };

    const handleWidthBlur = () => {
        try {
            localStorage.setItem(WIDTH_KEY, width);
        } catch (err) { /* ignore */ }
        setDirty(true);
    };

    const handleReload = () => {
        location.reload();
    };

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage({
                defaultMessage: '显示设置',
                id: 'wwh.displayPanel.title'
            })}
            onRequestClose={props.onClose}
            id="wwhDisplayPanel"
        >
            <Box className={styles.body}>
                <p className={styles.intro}>
                    <FormattedMessage
                        defaultMessage="调整移动端显示效果。修改后需要刷新页面才能生效。"
                        id="wwh.displayPanel.intro"
                    />
                </p>

                <div className={styles.setting}>
                    <label className={styles.label}>
                        <FancyCheckbox checked={enabled} onChange={handleToggle} />
                        <FormattedMessage
                            defaultMessage="启用移动端视口缩放"
                            id="wwh.displayPanel.enable"
                        />
                    </label>
                    <div className={styles.help}>
                        <FormattedMessage
                            defaultMessage="开启后，移动端编辑器会强制使用桌面视口宽度，自动缩放到屏幕大小，避免滚动。仅对移动设备生效，桌面浏览器不受影响。"
                            id="wwh.displayPanel.enableHelp"
                        />
                    </div>
                </div>

                <div className={styles.setting}>
                    <label className={styles.label}>
                        <FormattedMessage
                            defaultMessage="视口宽度（px）"
                            id="wwh.displayPanel.width"
                        />
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        value={width}
                        onChange={handleWidthChange}
                        onBlur={handleWidthBlur}
                        disabled={!enabled}
                    />
                    <div className={styles.help}>
                        <FormattedMessage
                            defaultMessage="建议 1100 - 1400。数值越大，缩得越狠，越不容易滚动。"
                            id="wwh.displayPanel.widthHelp"
                        />
                    </div>
                </div>

                {dirty ? (
                    <div className={styles.reloadNotice}>
                        <span>
                            <FormattedMessage
                                defaultMessage="设置已保存，需要刷新页面才能生效。"
                                id="wwh.displayPanel.reloadNotice"
                            />
                        </span>
                        <button className={styles.reloadButton} onClick={handleReload}>
                            <FormattedMessage
                                defaultMessage="立即刷新"
                                id="wwh.displayPanel.reload"
                            />
                        </button>
                    </div>
                ) : null}
            </Box>
        </Modal>
    );
};

DisplayPanel.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func
};

export default injectIntl(DisplayPanel);