import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import styles from './security-panel.css';

const TRUST_ALL_KEY = 'tw:trust_all_extensions';
const ALLOW_THIRD_PARTY_KEY = 'tw:allow_third_party_unsandboxed';

const readBool = key => {
    try {
        return localStorage.getItem(key) === 'true';
    } catch (e) {
        return false;
    }
};

const writeBool = (key, value) => {
    try {
        if (value) {
            localStorage.setItem(key, 'true');
        } else {
            localStorage.removeItem(key);
        }
    } catch (e) {
        // ignore
    }
};

const Setting = ({label, help, checked, onChange}) => (
    <div className={styles.setting}>
        <label className={styles.label}>
            <FancyCheckbox checked={checked} onChange={onChange} />
            {label}
        </label>
        {checked && help ? <div className={styles.help}>{help}</div> : null}
    </div>
);

Setting.propTypes = {
    label: PropTypes.node,
    help: PropTypes.node,
    checked: PropTypes.bool,
    onChange: PropTypes.func
};

const SecurityPanel = props => {
    const [trustAll, setTrustAll] = React.useState(() => readBool(TRUST_ALL_KEY));
    const [allowThirdParty, setAllowThirdParty] = React.useState(() => readBool(ALLOW_THIRD_PARTY_KEY));

    const handleTrustAll = React.useCallback(e => {
        const v = e.target.checked;
        if (v) {
            // eslint-disable-next-line no-alert
            if (!window.confirm('开启后，任何作品加载的扩展都不会再弹确认框。确定要开启吗？')) return;
        }
        writeBool(TRUST_ALL_KEY, v);
        setTrustAll(v);
    }, []);

    const handleAllowThirdParty = React.useCallback(e => {
        const v = e.target.checked;
        if (v) {
            // eslint-disable-next-line no-alert
            if (!window.confirm('开启后，第三方 URL 扩展可以以非沙箱模式运行，风险自负。确定要开启吗？')) return;
        }
        writeBool(ALLOW_THIRD_PARTY_KEY, v);
        setAllowThirdParty(v);
    }, []);

    return (
        <Modal
            className={styles.modalContent}
            contentLabel={props.intl.formatMessage({
                defaultMessage: '扩展安全设置',
                id: 'wwh.securityPanel.title'
            })}
            onRequestClose={props.onClose}
            id="wwhSecurityPanel"
        >
            <Box className={styles.body}>
                <p className={styles.intro}>
                    <FormattedMessage
                        defaultMessage="控制扩展的加载和运行权限。"
                        id="wwh.securityPanel.intro"
                    />
                </p>

                <Setting
                    checked={trustAll}
                    onChange={handleTrustAll}
                    label={
                        <FormattedMessage
                            defaultMessage="总是信任所有扩展（危险）"
                            id="wwh.securityPanel.trustAll"
                        />
                    }
                    help={
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="开启后，作品加载的任何扩展都不会再弹确认框。但第三方扩展仍然在沙箱中运行，不会破坏作品的可移植性。"
                            id="wwh.securityPanel.trustAllHelp"
                        />
                    }
                />

                <Setting
                    checked={allowThirdParty}
                    onChange={handleAllowThirdParty}
                    label={
                        <FormattedMessage
                            defaultMessage="允许第三方 URL 扩展非沙箱运行（危险）"
                            id="wwh.securityPanel.allowThirdParty"
                        />
                    }
                    help={
                        <FormattedMessage
                            // eslint-disable-next-line max-len
                            defaultMessage="开启后，来自非官方扩展库的第三方 URL 扩展将以非沙箱模式运行，拥有完整的页面权限。注意：作品在其它 Scratch 编辑器打开时可能会无法运行。"
                            id="wwh.securityPanel.allowThirdPartyHelp"
                        />
                    }
                />

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <FormattedMessage
                            defaultMessage="添加扩展源"
                            id="wwh.securityPanel.addSource"
                        />
                    </h3>
                    <p className={styles.comingSoon}>
                        <FormattedMessage
                            defaultMessage="（暂未完工）"
                            id="wwh.securityPanel.comingSoon"
                        />
                    </p>
                </div>
            </Box>
        </Modal>
    );
};

SecurityPanel.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func
};

export default injectIntl(SecurityPanel);