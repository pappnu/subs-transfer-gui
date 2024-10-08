import React from 'react';
import {MemoryRouter, Route, Routes, useMatch} from 'react-router-dom';
import {arrayMove} from '@dnd-kit/sortable';

import {Processing} from '../processing/processing';
import {Settings} from '../settings/settings';
import {StyleableNavLink} from '../general/styleableNavLink';
import {StyleableButton} from '../general/styleableButton';

import rootStyles from '../../../styles/navigation/root';
import fileListStyles from '../../../styles/processing/fileList';
import processingSettingsStyles from '../../../styles/processing/settings';
import processingLayoutStyles from '../../../styles/processing/layout';
import settingsStyles from '../../../styles/settings/settings';
import settingsLayoutStyles from '../../../styles/settings/layout';
import {PlaySvg} from '../graphics/playSvg';
import {StopSvg} from '../graphics/stopSvg';

let nextPathId = 1;

function StartButton(props) {
    const match = useMatch('/');
    return match ? <StyleableButton {...props} /> : null;
}

export class Root extends React.Component {
    constructor(props) {
        super(props);

        const styles = {
            root: rootStyles,
            processing: {
                fileList: fileListStyles,
                settings: processingSettingsStyles,
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
            log: [],
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
                autoSushiAudioLanguages: 'ja,jp',
                autoSushiAudioNames: '',
                autoSushiSubtitlesLanguages: 'en',
                autoSushiSubtitlesNames: 'dialog,full',
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
        window.ipcRenderer.removeAllListeners('log');
        window.ipcRenderer.removeAllListeners('is-window-maximized');
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
        const newState = this.state;
        for (const setting in newState.settings) {
            if (state.settings.hasOwnProperty(setting)) {
                newState.settings[setting] = state.settings[setting];
            }
        }
        for (const executable in newState.executables) {
            if (state.executables.hasOwnProperty(executable)) {
                newState.executables[executable] =
                    state.executables[executable];
            }
        }
        this.setState(newState);
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
            this.setState({processing: true, log: []}, () => {
                const sourcePaths = this.state.sourcePaths
                    .map((item) => item.path)
                    .reverse();
                const targetPaths = this.state.targetPaths
                    .map((item) => item.path)
                    .reverse();

                const settings = {};
                for (const setting in this.state.settings) {
                    if (
                        setting !== 'autoSushiAudioLanguages' &&
                        setting !== 'autoSushiAudioNames' &&
                        setting !== 'autoSushiSubtitlesLanguages' &&
                        setting !== 'autoSushiSubtitlesNames'
                    ) {
                        settings[setting] = this.state.settings[setting];
                    }
                }

                const autoSushiAudio = {
                    languages: this.state.settings.autoSushiAudioLanguages,
                    names: this.state.settings.autoSushiAudioNames,
                };
                const autoSushiSubtitles = {
                    languages: this.state.settings.autoSushiSubtitlesLanguages,
                    names: this.state.settings.autoSushiSubtitlesNames,
                };
                settings.autoSushiAudio = autoSushiAudio;
                settings.autoSushiSubtitles = autoSushiSubtitles;

                const iterate = () => {
                    if (targetPaths.length > 0 && this.state.processing) {
                        const source = sourcePaths.pop();
                        const target = targetPaths.pop();
                        window.ipcRenderer.send('process-mkv', {
                            source: source,
                            target: target,
                            settings: settings,
                            sushi: this.state.executables.sushiPath,
                            mkvmerge: this.state.executables.mkvmergePath,
                        });
                    } else {
                        window.ipcRenderer.removeAllListeners('process-mkv');
                        const errorsEncountered = this.state.log.find(
                            (item) => item.type === 'error',
                        );
                        this.setState({
                            processing: false,
                            log: [
                                ...this.state.log,
                                errorsEncountered
                                    ? {
                                          type: 'error',
                                          value: 'Finished with error(s)',
                                      }
                                    : {type: 'log', value: 'Finished'},
                            ],
                        });
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

    log = (data) => {
        if (data) {
            const newLog = [...this.state.log, data];
            this.setState({log: newLog});
        }
    };

    handleFileDrop = (event, listName, sorting = undefined) => {
        const newState = {};
        newState[listName] = this.state[listName].concat(
            Array.from(event.dataTransfer.files).map((item) => ({
                id: nextPathId++,
                path: item.path,
            })),
        );
        if (sorting) {
            newState[listName] = newState[listName].sort((a, b) =>
                sorting(
                    window.nodeModules.path.basename(a.path),
                    window.nodeModules.path.basename(b.path),
                ),
            );
        }
        this.setState(newState);
    };

    handleSourceDrop = (event) => {
        this.handleFileDrop(event, 'sourcePaths');
    };

    handleTargetDrop = (event) => {
        this.handleFileDrop(event, 'targetPaths');
    };

    addFiles = (paths, listName, sorting = undefined) => {
        const newState = {};
        newState[listName] = this.state[listName].concat(
            paths.map((item) => ({id: nextPathId++, path: item})),
        );
        if (sorting) {
            newState[listName] = newState[listName].sort((a, b) =>
                sorting(
                    window.nodeModules.path.basename(a.path),
                    window.nodeModules.path.basename(b.path),
                ),
            );
        }
        this.setState(newState);
    };

    addSources = async () => {
        const result = await window.ipcRenderer.invoke('select-files');
        this.addFiles(result.filePaths, 'sourcePaths');
    };

    addTargets = async () => {
        const result = await window.ipcRenderer.invoke('select-files');
        this.addFiles(result.filePaths, 'targetPaths');
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

    findDragContainer = (id) => {
        const containers = ['sourcePaths', 'targetPaths'];
        if (containers.includes(id)) {
            return id;
        }
        return containers.find((cont) =>
            this.state[cont].find((item) => item.id === id),
        );
    };

    movePathWithinList = (event) => {
        const {active, over} = event;
        const activeContainer = this.findDragContainer(active.id);
        const overContainer = this.findDragContainer(over.id);
        if (active.id !== over.id) {
            const newState = {};
            const moveToList = [...this.state[overContainer]];
            const newIndex = moveToList.findIndex(
                (item) => item.id === over.id,
            );
            if (activeContainer === overContainer) {
                const oldIndex = moveToList.findIndex(
                    (item) => item.id === active.id,
                );
                newState[overContainer] = arrayMove(
                    moveToList,
                    oldIndex,
                    newIndex,
                );
            } else {
                const currentList = [...this.state[activeContainer]];
                const oldIndex = currentList.findIndex(
                    (item) => item.id === active.id,
                );
                currentList.splice(oldIndex, 1);
                moveToList.splice(newIndex, 0, active.id);
                newState[activeContainer] = currentList;
                newState[overContainer] = moveToList;
            }
            this.setState(newState);
        }
    };

    moveToSourcesOrPaths = (event) => {
        const {active, over} = event;
        const activeContainer = this.findDragContainer(active.id);
        const overContainer = this.findDragContainer(over.id);
        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }
        const newState = {};
        const moveToList = [...this.state[overContainer]];
        const newIndex = moveToList.findIndex((item) => item.id === over.id);
        const currentList = [...this.state[activeContainer]];
        const oldIndex = currentList.findIndex((item) => item.id === active.id);
        const itemToMove = currentList.splice(oldIndex, 1)[0];
        moveToList.splice(newIndex, 0, itemToMove);
        newState[activeContainer] = currentList;
        newState[overContainer] = moveToList;
        console.log(newState);
        this.setState(newState);
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
                                navLinkProps={{end: true, to: '/'}}
                                text={'Home'}
                            />
                            <StyleableNavLink
                                style={this.state.styles.root.link}
                                activeStyle={this.state.styles.root.activeLink}
                                navLinkProps={{end: true, to: '/settings'}}
                                text={'Settings'}
                            />
                        </div>
                        <div style={this.state.styles.root.buttonContainer}>
                            <StartButton
                                style={
                                    this.state.processing
                                        ? this.state.styles.processing.settings
                                              .stopButton
                                        : this.state.styles.processing.settings
                                              .startButton
                                }
                                onClick={
                                    this.state.processing
                                        ? this.stopProcessing
                                        : this.startProcessing
                                }>
                                <div
                                    style={
                                        this.state.styles.processing.settings
                                            .iconContainer
                                    }>
                                    {this.state.processing ? (
                                        <StopSvg
                                            style={
                                                this.state.styles.processing
                                                    .settings.icon
                                            }
                                        />
                                    ) : (
                                        <PlaySvg
                                            style={
                                                this.state.styles.processing
                                                    .settings.icon
                                            }
                                        />
                                    )}
                                </div>
                                <div
                                    style={
                                        this.state.styles.processing.settings
                                            .buttonTextContainer
                                    }>
                                    {this.state.processing ? 'STOP' : 'START'}
                                </div>
                            </StartButton>
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
                    <Routes>
                        <Route
                            path="/settings"
                            element={
                                <Settings
                                    style={this.state.styles.settings}
                                    onTextAreaChange={this.changeExecutablePath}
                                    textAreaValues={this.state.executables}
                                    pickExecutablePath={this.pickExecutablePath}
                                />
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <Processing
                                    style={this.state.styles.processing}
                                    handleSourceDrop={this.handleSourceDrop}
                                    handleTargetDrop={this.handleTargetDrop}
                                    addSources={this.addSources}
                                    addTargets={this.addTargets}
                                    removeSource={this.removeSource}
                                    removeTarget={this.removeTarget}
                                    removeAllSources={this.removeAllSources}
                                    removeAllTargets={this.removeAllTargets}
                                    move={this.movePathWithinList}
                                    moveOver={this.moveToSourcesOrPaths}
                                    changeBooleanSetting={
                                        this.changeBooleanSetting
                                    }
                                    changeStringSetting={
                                        this.changeStringSetting
                                    }
                                    sourcePaths={this.state.sourcePaths}
                                    targetPaths={this.state.targetPaths}
                                    settings={this.state.settings}
                                    log={this.state.log}
                                />
                            }
                        />
                    </Routes>
                </MemoryRouter>
            </div>
        );
    }
}
