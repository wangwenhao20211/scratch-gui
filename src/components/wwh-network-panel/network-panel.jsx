import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import networkManager from '../../lib/wwh-network-manager';
import styles from './network-panel.css';

const formatTime = time => new Date(time).toLocaleTimeString();
const statusText = status =>
    ({
        pending: '进行中',
        success: '成功',
        'http-error': 'HTTP 错误',
        blocked: '已拦截',
        error: '失败',
        queued: '已提交',
        connected: '已连接',
        closed: '已关闭'
    })[status] || status;

class NetworkPanel extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            config: networkManager.getConfig(),
            requests: networkManager.getRequests(),
            selectedId: null
        };
        this.unsubscribe = null;
        this.handleChange = this.handleChange.bind(this);
    }
    componentDidMount() {
        this.unsubscribe = networkManager.subscribe(() =>
            this.setState({
                config: networkManager.getConfig(),
                requests: networkManager.getRequests()
            })
        );
    }
    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }
    handleChange(key, value) {
        networkManager.setConfig({[key]: value});
    }
    render() {
        const {config, requests, selectedId} = this.state;
        const selected = requests.find(request => request.id === selectedId);
        const blocked = requests.filter(request => request.status === 'blocked').length;
        return (
            <Modal
                className={styles.modalContent}
                contentLabel={this.props.intl.formatMessage({
                    defaultMessage: '网络请求管理',
                    id: 'wwh.networkPanel.title'
                })}
                onRequestClose={this.props.onClose}
                id="wwhNetworkPanel"
            >
                <Box className={styles.body}>
                    <div className={styles.header}>
                        <div>
                            <strong>网络请求管理</strong>
                            <div className={styles.subheading}>全局网络活动 · 最近 {requests.length} 条记录</div>
                        </div>
                        <button className={styles.clearButton} onClick={() => networkManager.clear()}>
                            清空记录
                        </button>
                    </div>

                    <div className={styles.stats}>
                        <div>
                            <strong>{requests.length}</strong>
                            <span>请求记录</span>
                        </div>
                        <div>
                            <strong>{blocked}</strong>
                            <span>已拦截</span>
                        </div>
                        <div>
                            <strong>
                                {
                                    requests.filter(
                                        request => request.status === 'pending' || request.status === 'connected'
                                    ).length
                                }
                            </strong>
                            <span>进行中</span>
                        </div>
                    </div>

                    <section className={styles.section}>
                        <h3>请求策略</h3>
                        <label className={styles.field}>
                            <span>管理模式</span>
                            <select value={config.mode} onChange={e => this.handleChange('mode', e.target.value)}>
                                <option value="allow">全部允许</option>
                                <option value="whitelist">白名单（仅允许列表内域名）</option>
                                <option value="blacklist">黑名单（拦截列表内域名）</option>
                                <option value="block">全部禁止</option>
                            </select>
                        </label>
                        <label className={styles.field}>
                            <span>白名单域名</span>
                            <textarea
                                value={config.whitelist}
                                placeholder="example.com, api.example.org"
                                onChange={e => this.handleChange('whitelist', e.target.value)}
                                rows="2"
                            />
                        </label>
                        <label className={styles.field}>
                            <span>黑名单域名</span>
                            <textarea
                                value={config.blacklist}
                                placeholder="tracker.example.com"
                                onChange={e => this.handleChange('blacklist', e.target.value)}
                                rows="2"
                            />
                        </label>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={config.ask}
                                onChange={e => this.handleChange('ask', e.target.checked)}
                            />
                            每次请求前询问（浏览器弹窗）
                        </label>
                    </section>

                    <section className={styles.telemetry}>
                        <div>
                            <strong>禁止 TurboWarp 遥测</strong>
                            <p>
                                仓库当前 analytics.js 已将事件上报设为空操作；此开关还会拦截可识别的 telemetry /
                                analytics / tracking 请求，不会关闭普通作品资源请求。
                            </p>
                        </div>
                        <button
                            className={config.telemetryDisabled ? styles.enabledButton : styles.actionButton}
                            onClick={() => networkManager.setTelemetryDisabled(!config.telemetryDisabled)}
                        >
                            {config.telemetryDisabled ? '已开启拦截' : '一键禁止'}
                        </button>
                    </section>

                    <section className={styles.section}>
                        <h3>实时请求记录</h3>
                        {requests.length === 0 ? (
                            <div className={styles.empty}>
                                暂时没有捕获到请求。运行作品或打开扩展后，这里会显示支持的网络活动。
                            </div>
                        ) : (
                            <div className={styles.requestList}>
                                {requests.map(request => (
                                    <button
                                        key={request.id}
                                        className={selectedId === request.id ? styles.selectedRequest : styles.request}
                                        onClick={() =>
                                            this.setState({selectedId: selectedId === request.id ? null : request.id})
                                        }
                                    >
                                        <span className={styles.method}>{request.method}</span>
                                        <span className={styles.url}>{request.url}</span>
                                        <span className={styles.status}>
                                            {statusText(request.status)}
                                            {request.statusCode ? ` · ${request.statusCode}` : ''}
                                        </span>
                                        <span className={styles.time}>{formatTime(request.time)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {selected && (
                            <div className={styles.details}>
                                <strong>请求详情</strong>
                                <div>URL：{selected.url}</div>
                                <div>来源：{selected.source}</div>
                                <div>方法：{selected.method}</div>
                                <div>状态：{statusText(selected.status)}</div>
                                {selected.error ? <div>错误：{selected.error}</div> : null}
                            </div>
                        )}
                    </section>
                    <p className={styles.disclaimer}>
                        说明：当前监控覆盖页面 fetch、XMLHttpRequest、WebSocket、sendBeacon，以及 TurboWarp 沙箱扩展
                        Worker 的 fetch。浏览器原生图片/脚本/媒体资源加载、Service Worker 内部请求，以及 Worker 内的
                        XHR/WebSocket 等通道仍可能绕过；请求头和请求体不会默认采集，以免记录 Cookie、令牌等敏感数据。
                    </p>
                    <p className={styles.author}>
                        Network manager by{' '}
                        <a href="https://space.bilibili.com/1512219051" target="_blank" rel="noreferrer">
                            wangwenhao20211
                        </a>
                    </p>
                </Box>
            </Modal>
        );
    }
}

NetworkPanel.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func
};

export default injectIntl(NetworkPanel);
