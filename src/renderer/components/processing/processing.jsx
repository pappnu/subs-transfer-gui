import React from 'react';

import {EditableList} from '../general/editableList';
import {SettingCheckbox} from '../general/settingCheckbox';
import {SettingTextArea} from '../general/settingTextArea';
import {StyleableButton} from '../general/StyleableButton';

export class Processing extends React.Component {
    render() {
        const sourcePaths = this.props.sourcePaths.map((item) =>
            window.nodeModules.path.basename(item),
        );
        const targetPaths = this.props.targetPaths.map((item) =>
            window.nodeModules.path.basename(item),
        );

        const booleanSettings = [
            {id: 'sushi', text: ' Run Sushi:'},
            {id: 'copyFonts', text: 'Copy Fonts:'},
            {id: 'targetSubs', text: 'Mux target subs:'},
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
                <div style={this.props.style.layout.settingsContainer}>
                    {booleanSettingComponents}
                    {textAreaSettingComponents}
                </div>
                <div style={this.props.style.layout.settingsContainer}>
                    <StyleableButton
                        style={this.props.style.settings.button}
                        onClick={this.props.startProcessing}
                        disabled={this.props.processing}
                        text={'Start'}
                    />
                </div>
                <div style={this.props.style.layout.logContainer}>
                    <textarea
                        style={this.props.style.settings.log}
                        disabled={true}
                        value={this.props.log}
                    />
                </div>
            </div>
        );
    }
}
