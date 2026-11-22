import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';
import Box from '../box/box.jsx';
import Modal from '../../containers/modal.jsx';
import AddonHooks from '../../addons/hooks.js';
import styles from './extension-manager.css';

class ExtensionManager extends React.PureComponent {
    constructor (props) {
        super(props);
        this.state = {
            extensions: [],
            selectedId: null,
            usages: {},
            loading: true,
            busy: false,
            error: null
        };
        this.refresh = this.refresh.bind(this);
        this.handleExtensionChange = this.handleExtensionChange.bind(this);
        this.handleUnload = this.handleUnload.bind(this);
    }
    componentDidMount () {
        this.props.vm.addListener('EXTENSION_ADDED', this.refresh);
        this.props.vm.addListener('EXTENSION_REMOVED', this.refresh);
        this.refresh();
    }
    componentWillUnmount () {
        this.props.vm.removeListener('EXTENSION_ADDED', this.refresh);
        this.props.vm.removeListener('EXTENSION_REMOVED', this.refresh);
    }
    async refresh () {
        try {
            const extensions = await this.props.vm.getLoadedExtensions();
            const usages = {};
            extensions.forEach(extension => {
                usages[extension.id] = this.props.vm.getExtensionUsage(extension.id);
            });
            this.setState(state => ({
                extensions,
                usages,
                selectedId: extensions.some(extension => extension.id === state.selectedId) ?
                    state.selectedId : (extensions[0] && extensions[0].id) || null,
                loading: false,
                error: null
            }));
        } catch (error) {
            this.setState({loading: false, error: error.message || String(error)});
        }
    }
    handleExtensionChange (extensionId) {
        this.setState({selectedId: extensionId});
    }
    handleLocate (block) {
        if (!block.targetId) return;
        const {vm} = this.props;
        if (vm.editingTarget && vm.editingTarget.id !== block.targetId) {
            vm.setEditingTarget(block.targetId);
        }
        const workspace = AddonHooks.blocklyWorkspace;
        if (workspace && workspace.getBlockById(block.blockId)) {
            workspace.centerOnBlock(block.blockId);
            workspace.highlightBlock(block.blockId);
        }
        this.props.onClose();
    }
    async handleUnload () {
        const extension = this.state.extensions.find(item => item.id === this.state.selectedId);
        const usage = this.state.usages[this.state.selectedId];
        if (!extension || !usage || usage.count !== 0 || this.state.busy) return;
        if (!window.confirm(`确定卸载扩展“${extension.name}”吗？此操作不会删除项目文件。`)) return; // eslint-disable-line no-alert // eslint-disable-line no-alert
        this.setState({busy: true, error: null});
        try {
            await this.props.vm.unloadExtension(extension.id);
            await this.refresh();
        } catch (error) {
            this.setState({error: error.message || String(error)});
        } finally {
            this.setState({busy: false});
        }
    }
    render () {
        const {extensions, selectedId, usages, loading, busy, error} = this.state;
        const selected = extensions.find(extension => extension.id === selectedId);
        const usage = selected ? usages[selected.id] : null;
        return (
            <Modal
                className={styles.modalContent}
                contentLabel="扩展管理"
                onRequestClose={this.props.onClose}
                id="wwhExtensionManager"
            >
                <Box className={styles.body}>
                    <header className={styles.header}>
                        <div>
                            <strong>扩展管理</strong>
                            <p>当前项目已加载的扩展 · {extensions.length} 个</p>
                        </div>
                        <button className={styles.refreshButton} onClick={this.refresh}>刷新</button>
                    </header>
                    {error && <div className={styles.error}>{error}</div>}
                    {loading ? (
                        <div className={styles.empty}>正在读取扩展列表…</div>
                    ) : extensions.length === 0 ? (
                        <div className={styles.empty}>当前没有已加载的扩展</div>
                    ) : (
                        <div className={styles.layout}>
                            <nav className={styles.extensionList} aria-label="已加载扩展">
                                {extensions.map(extension => {
                                    const count = usages[extension.id] ? usages[extension.id].count : 0;
                                    return (
                                        <button
                                            className={extension.id === selectedId ?
                                                styles.selectedExtension : styles.extension}
                                            key={extension.id}
                                            onClick={() => this.handleExtensionChange(extension.id)}
                                        >
                                            <span className={styles.extensionName}>{extension.name}</span>
                                            <span className={styles.extensionMeta}>
                                                {extension.builtin ? '内置' : '外部'} · {count} 次引用
                                            </span>
                                        </button>
                                    );
                                })}
                            </nav>
                            {selected && usage && (
                                <section className={styles.details}>
                                    <h3>{selected.name}</h3>
                                    <div className={styles.metadata}>
                                        <span>标识：{selected.id}</span>
                                        <span>类型：{selected.builtin ? '内置扩展' : '外部扩展'}</span>
                                        {selected.url && <span className={styles.url} title={selected.url}>来源：{selected.url}</span>}
                                    </div>
                                    <div className={styles.usageSummary}>
                                        <strong>{usage.count}</strong>
                                        <span>个积木正在项目中使用</span>
                                    </div>
                                    {usage.blocks.length > 0 ? (
                                        <div className={styles.blockList}>
                                            {usage.blocks.map(block => (
                                                <button
                                                    className={styles.block}
                                                    key={block.targetId + ':' + block.blockId}
                                                    disabled={!block.targetId}
                                                    onClick={() => this.handleLocate(block)}
                                                >
                                                    <span>{(selected.blocks.find(info => info.opcode === block.opcode.slice(selected.id.length + 1)) || {}).text || block.opcode}</span>
                                                    <small>{block.targetName} · 定位积木</small>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.empty}>没有积木引用此扩展，可以安全卸载</div>
                                    )}
                                    <button
                                        className={styles.unloadButton}
                                        disabled={usage.count !== 0 || busy}
                                        onClick={this.handleUnload}
                                    >
                                        {busy ? '正在卸载…' : usage.count === 0 ? '卸载此扩展' : `仍有 ${usage.count} 次引用，暂不可卸载`}
                                    </button>
                                    <p className={styles.note}>
                                        只有项目中没有该扩展积木引用时才允许卸载。卸载不会删除积木，也不会修改项目文件。
                                    </p>
                                </section>
                            )}
                        </div>
                    )}
                </Box>
            </Modal>
        );
    }
}

ExtensionManager.propTypes = {
    intl: intlShape,
    onClose: PropTypes.func.isRequired,
    vm: PropTypes.object.isRequired
};

export default injectIntl(ExtensionManager);
