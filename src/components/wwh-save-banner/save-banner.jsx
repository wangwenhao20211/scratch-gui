import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import styles from './save-banner.css';

const SaveBanner = ({state, progress, errorMessage, onDismiss}) => {
    const [collapsed, setCollapsed] = React.useState(false);

    React.useEffect(() => {
        if (state === 'done') {
            const timer = setTimeout(() => {
                onDismiss();
            }, 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [state, onDismiss]);

    React.useEffect(() => {
        if (state !== 'idle') {
            setCollapsed(false);
        }
    }, [state]);

    if (state === 'idle') {
        return null;
    }

    const percent = Math.round((progress || 0) * 100);

    let statusText = null;
    if (state === 'saving') {
        statusText = <FormattedMessage defaultMessage="正在保存..." id="wwh.saveBanner.saving" />;
    } else if (state === 'done') {
        statusText = <FormattedMessage defaultMessage="保存完成" id="wwh.saveBanner.done" />;
    } else if (state === 'error') {
        statusText = <FormattedMessage defaultMessage="保存失败" id="wwh.saveBanner.error" />;
    }

    let icon = '';
    if (state === 'saving') icon = '⬇';
    else if (state === 'done') icon = '✓';
    else if (state === 'error') icon = '✕';

    return (
        <div className={`${styles.banner} ${styles[state]} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                <span className={styles.icon}>{icon}</span>
                <span className={styles.text}>{statusText}</span>
                {state === 'saving' ? <span className={styles.percent}>{percent}%</span> : null}
                <button
                    className={styles.button}
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? '展开' : '折叠'}
                >
                    {collapsed ? '▽' : '△'}
                </button>
                <button
                    className={styles.button}
                    onClick={onDismiss}
                    title="关闭"
                >
                    {'×'}
                </button>
            </div>
            {!collapsed && state === 'saving' ? (
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{width: `${percent}%`}}
                    />
                </div>
            ) : null}
            {!collapsed && state === 'error' && errorMessage ? (
                <div className={styles.errorMessage}>{errorMessage}</div>
            ) : null}
        </div>
    );
};

SaveBanner.propTypes = {
    state: PropTypes.oneOf(['idle', 'saving', 'done', 'error']),
    progress: PropTypes.number,
    errorMessage: PropTypes.string,
    onDismiss: PropTypes.func
};

SaveBanner.defaultProps = {
    state: 'idle',
    progress: 0
};

export default SaveBanner;