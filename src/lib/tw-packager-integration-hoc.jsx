import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import log from './log';
import {getIsShowingProject} from '../reducers/project-state';

const PACKAGER_URL = 'https://packager.turbowarp.org';
const PACKAGER_ORIGIN = PACKAGER_URL;
// LeafOS packager: third-party deployment of zx's SC project packager.
// It implements the same import_from / p4 postMessage protocol as TurboWarp Packager.
const LEAFOS_PACKAGER_ORIGIN = 'https://wangwenhao20211.github.io';
const LEAFOS_PACKAGER_URL = `${LEAFOS_PACKAGER_ORIGIN}/leafos-packager`;
const PACKAGER_ORIGINS = [PACKAGER_ORIGIN, LEAFOS_PACKAGER_ORIGIN];

const PackagerIntegrationHOC = function (WrappedComponent) {
    class PackagerIntegrationComponent extends React.Component {
        constructor(props) {
            super(props);
            this.handleClickPackager = this.handleClickPackager.bind(this);
            this.handleClickLeafosPackager = this.handleClickLeafosPackager.bind(this);
            this.handleMessage = this.handleMessage.bind(this);
        }
        componentDidMount() {
            window.addEventListener('message', this.handleMessage);
        }
        componentWillUnmount() {
            window.removeEventListener('message', this.handleMessage);
        }
        handleClickPackager() {
            if (this.props.canOpenPackager) {
                window.open(`${PACKAGER_URL}/?import_from=${location.origin}`);
            }
        }
        handleClickLeafosPackager() {
            if (this.props.canOpenPackager) {
                window.open(`${LEAFOS_PACKAGER_URL}/?import_from=${location.origin}`);
            }
        }
        handleMessage(e) {
            if (!PACKAGER_ORIGINS.includes(e.origin)) {
                return;
            }

            if (!this.props.canOpenPackager) {
                return;
            }

            const packagerData = e.data.p4;
            if (packagerData.type !== 'ready-for-import') {
                return;
            }

            // The packager needs to know that we will be importing something so it can display a loading screen
            e.source.postMessage(
                {
                    p4: {
                        type: 'start-import'
                    }
                },
                e.origin
            );

            this.props.vm
                .saveProjectSb3('arraybuffer')
                .then(buffer => {
                    const name = `${this.props.reduxProjectTitle}.sb3`;
                    e.source.postMessage(
                        {
                            p4: {
                                type: 'finish-import',
                                data: buffer,
                                name
                            }
                        },
                        e.origin,
                        [buffer]
                    );
                })
                .catch(err => {
                    log.error(err);
                    e.source.postMessage(
                        {
                            p4: {
                                type: 'cancel-import'
                            }
                        },
                        e.origin
                    );
                });
        }
        render() {
            const {
                /* eslint-disable no-unused-vars */
                canOpenPackager,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    onClickPackager={this.handleClickPackager}
                    onClickLeafosPackager={this.handleClickLeafosPackager}
                    {...props}
                />
            );
        }
    }
    PackagerIntegrationComponent.propTypes = {
        canOpenPackager: PropTypes.bool,
        reduxProjectTitle: PropTypes.string,
        vm: PropTypes.shape({
            saveProjectSb3: PropTypes.func
        })
    };
    const mapStateToProps = state => ({
        canOpenPackager: getIsShowingProject(state.scratchGui.projectState.loadingState),
        reduxProjectTitle: state.scratchGui.projectTitle,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = () => ({});
    return connect(mapStateToProps, mapDispatchToProps)(PackagerIntegrationComponent);
};

export {PackagerIntegrationHOC as default};
