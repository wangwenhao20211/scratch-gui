import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import styles from './network-panel.css';

const NetworkPanel = props => (
    <Modal
        className={styles.modalContent}
        contentLabel={props.intl.formatMessage({
            defaultMessage: '网络请求管理',
            id: 'wwh.networkPanel.title'
        })}
        onRequestClose={props.onClose}
        id="wwhNetworkPanel"
    >
        <Box className={styles.body}>
            <p className={styles.author}>
                {'Network request manager v1.0 by '}
                <a href="https://space.bilibili.com/1512219051" target="_blank" rel="noreferrer">
                    wangwenhao20211
                </a>
            </p>
            <p className={styles.notice}>
                <FormattedMessage
                    // eslint-disable-next-line max-len
                    defaultMessage="此面板尚未完工。目前请前往「设置 → 插件（Addons）」中启用「网络请求管理」插件来使用完整功能。"
                    id="wwh.networkPanel.comingSoon"
                />
            </p>
        </Box>
    </Modal>
);

NetworkPanel.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func
};

export default injectIntl(NetworkPanel);