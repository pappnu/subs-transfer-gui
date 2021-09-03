import React from 'react';
import {MemoryRouter, Route, Switch} from 'react-router-dom';

import {Processing} from '../processing/processing';
import {Settings} from '../settings/settings';
import {naturalSort} from '../utility/sorting';
import {StyleableNavLink} from '../general/styleableNavLink';
import {StyleableButton} from '../general/StyleableButton';

import rootStyles from '../../../styles/navigation/root';
import fileListStyles from '../../../styles/processing/fileList';
import processingSettingStyles from '../../../styles/processing/settings';
import processingLayoutStyles from '../../../styles/processing/layout';
import settingsStyles from '../../../styles/settings/settings';
import settingsLayoutStyles from '../../../styles/settings/layout';

export class Root extends React.Component {
    constructor(props) {
        super(props);

        const styles = {
            root: rootStyles,
            processing: {
                fileList: fileListStyles,
                settings: processingSettingStyles,
                layout: processingLayoutStyles,
            },
            settings: {
                layout: settingsLayoutStyles,
                settings: settingsStyles,
            },
        };

        this.state = {
            styles: styles,
            maximized: false,
            sourcePaths: [],
            targetPaths: [],
            log: '',
            processing: false,
            executables: {
                sushiPath: 'sushi',
                mkvmergePath: 'mkvmerge',
            },
            settings: {
                copyFonts: true,
                targetSubs: false,
                sushi: true,
                autoSushiArgs: true,
                mux: true,
                autoSushiAudio:
                    '{"languages": ["jpn", "japan", "jap"], "names": []}',
                autoSushiSubtitles:
                    '{"languages": ["eng", "english"], "names": ["dialogue", "full"]}',
                sushiArgs: '',
                audioLanguages: '',
            },
            loading: false,
            loadingText: 'Saving state...',
        };
    }

    componentDidMount() {
        window.ipcRenderer.on('close', this.handleClose);
        window.ipcRenderer.on('save-state', (reply) =>
            this.saveState(undefined, reply),
        );
        window.ipcRenderer.on('get-state', this.initState);
        window.ipcRenderer.on('log', this.log);
        window.ipcRenderer.on('is-window-maximized', this.setMaximizedState);
        window.ipcRenderer.send('is-window-maximized');

        window.ipcRenderer.send('get-state', {
            default: {
                executables: this.state.executables,
                settings: this.state.settings,
            },
        });
    }

    componentWillUnmount() {
        window.ipcRenderer.removeListener('log', this.log);
        window.ipcRenderer.removeListener(
            'is-window-maximized',
            this.setMaximizedState,
        );
    }

    setMaximizedState = (data) => {
        if (typeof data === 'boolean' && this.state.maximized !== data) {
            this.setState({maximized: data});
        }
    };

    handleClose = (ready) => {
        if (ready) {
            window.ipcRenderer.send('close');
        } else {
            this.saveState(true);
        }
    };

    saveState = (closeAfter = false, close = false) => {
        if (close) {
            this.handleClose(true);
        }
        let reply = false;
        if (closeAfter) {
            reply = true;
        }
        window.ipcRenderer.send('save-state', {
            state: {
                executables: this.state.executables,
                settings: this.state.settings,
            },
            reply: reply,
        });
    };

    initState = (state) => {
        this.setState(state);
    };

    changeExecutablePath = (newPath, executable) => {
        const newState = this.state.executables;
        newState[executable] = newPath;
        this.setState({executables: newState});
    };

    pickExecutablePath = async (executable) => {
        const result = await window.ipcRenderer.invoke('select-files', {
            filters: [{name: 'Executable', extensions: ['exe']}],
            properties: ['openFile'],
        });
        this.changeExecutablePath(result.filePaths[0], executable);
    };

    startProcessing = () => {
        if (this.state.targetPaths.length > 0) {
            this.setState({processing: true}, () => {
                const sourcePaths = [...this.state.sourcePaths].reverse();
                const targetPaths = [...this.state.targetPaths].reverse();

                const iterate = () => {
                    if (targetPaths.length > 0 && this.state.processing) {
                        let source = sourcePaths.pop();
                        let target = targetPaths.pop();
                        window.ipcRenderer.send('process-mkv', {
                            source: source,
                            target: target,
                            settings: this.state.settings,
                            sushi: this.state.executables.sushiPath,
                            mkvmerge: this.state.executables.mkvmergePath,
                        });
                    } else {
                        window.ipcRenderer.removeListener(
                            'process-mkv',
                            iterate,
                        );
                        this.setState({processing: false});
                    }
                };

                window.ipcRenderer.on('process-mkv', iterate);

                iterate();
            });
        }
    };

    stopProcessing = () => {
        window.ipcRenderer.send('stop-process');
        this.setState({processing: false});
    };

    handleStopProcess = () => {

    }

    log = (data) => {
        const newLog = this.state.log + data;
        this.setState({log: newLog});
    };

    handleFileDrop = (event, listName, sorting = undefined) => {
        const newState = {};
        newState[listName] = this.state[listName].concat(
            Array.from(event.dataTransfer.files).map((item) => item.path),
        );
        if (sorting) {
            newState[listName] = newState[listName].sort((a, b) =>
                sorting(
                    window.nodeModules.path.basename(a),
                    window.nodeModules.path.basename(b),
                ),
            );
        }
        this.setState(newState);
    };

    handleSourceDrop = (event) => {
        this.handleFileDrop(event, 'sourcePaths', naturalSort);
    };

    handleTargetDrop = (event) => {
        this.handleFileDrop(event, 'targetPaths', naturalSort);
    };

    addFiles = (paths, listName, sorting = undefined) => {
        const newState = {};
        newState[listName] = this.state[listName].concat(paths);
        if (sorting) {
            newState[listName] = newState[listName].sort((a, b) =>
                sorting(
                    window.nodeModules.path.basename(a),
                    window.nodeModules.path.basename(b),
                ),
            );
        }
        this.setState(newState);
    };

    addSources = async () => {
        const result = await window.ipcRenderer.invoke('select-files');
        this.addFiles(result.filePaths, 'sourcePaths', naturalSort);
    };

    addTargets = async () => {
        const result = await window.ipcRenderer.invoke('select-files');
        this.addFiles(result.filePaths, 'targetPaths', naturalSort);
    };

    removeFile = (index, listName) => {
        const newState = {};
        newState[listName] = this.state[listName];
        newState[listName].splice(index, 1);
        this.setState(newState);
    };

    removeSource = (index) => {
        this.removeFile(index, 'sourcePaths');
    };

    removeTarget = (index) => {
        this.removeFile(index, 'targetPaths');
    };

    removeAllSources = () => {
        this.setState({sourcePaths: []});
    };

    removeAllTargets = () => {
        this.setState({targetPaths: []});
    };

    changeBooleanSetting = (setting) => {
        const newState = this.state.settings;
        newState[setting] = !newState[setting];
        this.setState({settings: newState});
    };

    changeStringSetting = (string, setting) => {
        const newState = this.state.settings;
        newState[setting] = string;
        this.setState({settings: newState});
    };

    render() {
        return this.state.loading ? (
            <div style={this.state.styles.root.loadingContainer}>
                {this.state.loadingText}
            </div>
        ) : (
            <div style={this.state.styles.root.rootContainer}>
                <MemoryRouter>
                    <div style={this.state.styles.root.menuContainer}>
                        <div style={this.state.styles.root.buttonContainer}>
                            <StyleableNavLink
                                style={this.state.styles.root.link}
                                activeStyle={this.state.styles.root.activeLink}
                                navLinkProps={{exact: true, to: '/'}}
                                text={'Home'}
                            />
                            <StyleableNavLink
                                style={this.state.styles.root.link}
                                activeStyle={this.state.styles.root.activeLink}
                                navLinkProps={{exact: true, to: '/settings'}}
                                text={'Settings'}
                            />
                        </div>
                        <div style={this.state.styles.root.buttonContainer}>
                            <StyleableButton
                                style={this.state.styles.root.menuButton}
                                text={'–'}
                                onClick={() =>
                                    window.ipcRenderer.send('minimize-window')
                                }
                            />
                            <StyleableButton
                                style={this.state.styles.root.menuButton}
                                text={this.state.maximized ? '❐' : '☐'}
                                onClick={() =>
                                    window.ipcRenderer.send('max-unmax-window')
                                }
                            />
                            <StyleableButton
                                style={this.state.styles.root.closeButton}
                                text={'✕'}
                                onClick={() => {
                                    window.ipcRenderer.send('close-window');
                                    this.setState({loading: true});
                                }}
                            />
                        </div>
                    </div>
                    <Switch>
                        <Route path="/settings">
                            <Settings
                                style={this.state.styles.settings}
                                onTextAreaChange={this.changeExecutablePath}
                                textAreaValues={this.state.executables}
                                pickExecutablePath={this.pickExecutablePath}
                            />
                        </Route>
                        <Route path="/">
                            <Processing
                                style={this.state.styles.processing}
                                startProcessing={this.startProcessing}
                                stopProcessing={this.stopProcessing}
                                handleSourceDrop={this.handleSourceDrop}
                                handleTargetDrop={this.handleTargetDrop}
                                addSources={this.addSources}
                                addTargets={this.addTargets}
                                removeSource={this.removeSource}
                                removeTarget={this.removeTarget}
                                removeAllSources={this.removeAllSources}
                                removeAllTargets={this.removeAllTargets}
                                changeBooleanSetting={this.changeBooleanSetting}
                                changeStringSetting={this.changeStringSetting}
                                sourcePaths={this.state.sourcePaths}
                                targetPaths={this.state.targetPaths}
                                settings={this.state.settings}
                                processing={this.state.processing}
                                log={this.state.log}
                            />
                        </Route>
                    </Switch>
                </MemoryRouter>
            </div>
        );
    }
}
