import React from 'react';

import {EditableList} from '../general/editableList';
import {SettingCheckbox} from '../general/settingCheckbox';
import {SettingTextArea} from '../general/settingTextArea';
import {StyleableButton} from '../general/StyleableButton';
import {AutoScrollingTextArea} from '../general/autoScrollingTextArea';

export class Processing extends React.Component {
    render() {
        const sourcePaths = this.props.sourcePaths.map((item) =>
            window.nodeModules.path.basename(item),
        );
        const targetPaths = this.props.targetPaths.map((item) =>
            window.nodeModules.path.basename(item),
        );

        const booleanSettings = [
            {id: 'sushi', text: 'Run Sushi:'},
            {id: 'autoSushiArgs', text: 'Auto track selection:'},
            {id: 'mux', text: 'Mux targets:'},
            {id: 'copyFonts', text: 'Copy Fonts:'},
            {id: 'targetSubs', text: 'Include target subs:'},
        ];

        const booleanSettingComponents = booleanSettings.map((item) => (
            <SettingCheckbox
                key={item.id}
                style={{
                    container: this.props.style.layout.checkboxSettingContainer,
                    text: this.props.style.settings.text,
                }}
                text={item.text}
                checked={this.props.settings[item.id]}
                onChange={() => {
                    this.props.changeBooleanSetting(item.id);
                }}
            />
        ));

        const textAreaSettings = [
            {
                id: 'autoSushiAudio',
                text: 'Audio languages and names to seek when looking for audio for sushi:',
            },
            {
                id: 'autoSushiSubtitles',
                text: 'Subtitle languages and names to seek when looking for subtitles for sushi:',
            },
            {id: 'sushiArgs', text: 'Sushi extra arguments:'},
            {id: 'audioLanguages', text: 'Target audio languages to not mux:'},
        ];

        const textAreaSettingComponents = textAreaSettings.map((item) => (
            <SettingTextArea
                key={item.id}
                style={{
                    container: this.props.style.layout.textSettingContainer,
                    text: this.props.style.settings.text,
                    textarea: this.props.style.settings.textarea,
                }}
                text={item.text}
                value={this.props.settings[item.id]}
                onChange={(event) => {
                    this.props.changeStringSetting(event.target.value, item.id);
                }}
            />
        ));
        return (
            <div style={this.props.style.layout.processingContainer}>
                <div style={this.props.style.layout.fileInputsContainer}>
                    <EditableList
                        style={{
                            headerContainer:
                                this.props.style.layout.headerContainer,
                            editableListContainer:
                                this.props.style.layout.editableListContainer,
                            fileButtonsContainer:
                                this.props.style.layout.fileButtonsContainer,
                            fileListContainer:
                                this.props.style.layout.fileListContainer,
                            fileList: this.props.style.fileList,
                            instructionsContainer:
                                this.props.style.layout.instructionsContainer,
                        }}
                        header={'Sources'}
                        addFiles={this.props.addSources}
                        removeAll={this.props.removeAllSources}
                        handleOnDrop={this.props.handleSourceDrop}
                        files={sourcePaths}
                        remove={this.props.removeSource}
                        instructions={'Drop files or folders here'}
                    />
                    <EditableList
                        style={{
                            headerContainer:
                                this.props.style.layout.headerContainer,
                            editableListContainer:
                                this.props.style.layout.editableListContainer,
                            fileButtonsContainer:
                                this.props.style.layout.fileButtonsContainer,
                            fileListContainer:
                                this.props.style.layout.fileListContainer,
                            fileList: this.props.style.fileList,
                            instructionsContainer:
                                this.props.style.layout.instructionsContainer,
                        }}
                        header={'Targets'}
                        addFiles={this.props.addTargets}
                        removeAll={this.props.removeAllTargets}
                        handleOnDrop={this.props.handleTargetDrop}
                        files={targetPaths}
                        remove={this.props.removeTarget}
                        instructions={'Drop files here'}
                    />
                </div>
                <div style={this.props.style.layout.booleanSettingsContainer}>
                    {booleanSettingComponents}
                </div>
                <div style={this.props.style.layout.textSettingsContainer}>
                    {textAreaSettingComponents}
                </div>
                <div style={this.props.style.layout.settingsContainer}>
                    <StyleableButton
                        style={
                            this.props.processing
                                ? this.props.style.settings.stopButton
                                : this.props.style.settings.startButton
                        }
                        onClick={
                            this.props.processing
                                ? this.props.stopProcessing
                                : this.props.startProcessing
                        }
                        disabled={false}
                        text={this.props.processing ? 'Stop' : 'Start'}
                    />
                </div>
                <div style={this.props.style.layout.logContainer}>
                    <AutoScrollingTextArea
                        style={this.props.style.settings.log}
                        disabled={false}
                        readOnly={true}
                        value={this.props.log}
                    />
                </div>
            </div>
        );
    }
}
