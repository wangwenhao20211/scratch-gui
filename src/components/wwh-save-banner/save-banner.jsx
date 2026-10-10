import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import styles from './save-banner.css';

const SaveBanner = ({state, progress, currentFile, errorMessage, onDismiss}) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [displayProgress, setDisplayProgress] = React.useState(0);
    const [elapsed, setElapsed] = React.useState(0);

    // 平滑动画：显示值慢慢追上真实值
    React.useEffect(() => {
        if (state !== 'saving') {
            setDisplayProgress(progress || 0);
            return undefined;
        }
        const timer = setInterval(() => {
            setDisplayProgress(prev => {
                if (prev >= progress) return progress;
                return Math.min(progress, prev + 0.005);
            });
        }, 50);
        return () => clearInterval(timer);
    }, [state, progress]);

    // 已用时间
    React.useEffect(() => {
        if (state !== 'saving') return undefined;
        setElapsed(0);
        const start = Date.now();
        const timer = setInterval(() => {
            setElapsed((Date.now() - start) / 1000);
        }, 100);
        return () => clearInterval(timer);
    }, [state]);

    // 完成 3 秒后自动消失
    React.useEffect(() => {
        if (state === 'done') {
            const timer = setTimeout(() => onDismiss(), 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [state, onDismiss]);

    React.useEffect(() => {
        if (state !== 'idle') setCollapsed(false);
    }, [state]);

    if (state === 'idle') return null;

    const percent = Math.round(displayProgress * 100);
    const elapsedText = elapsed.toFixed(1) + 's';

    let statusText = null;
    if (state === 'saving') {
        statusText = currentFile ? (
            <FormattedMessage
                defaultMessage="正在压缩：{file}"
                id="wwh.saveBanner.compressing"
                values={{file: currentFile}}
            />
        ) : (
            <FormattedMessage defaultMessage="正在准备..." id="wwh.saveBanner.preparing" />
        );
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
                {state === 'saving' ? (
                    <React.Fragment>
                        <span className={styles.elapsed}>{elapsedText}</span>
                        <span className={styles.percent}>{percent}%</span>
                    </React.Fragment>
                ) : null}
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
    currentFile: PropTypes.string,
    errorMessage: PropTypes.string,
    onDismiss: PropTypes.func
};

SaveBanner.defaultProps = {
    state: 'idle',
    progress: 0
};

export default SaveBanner;