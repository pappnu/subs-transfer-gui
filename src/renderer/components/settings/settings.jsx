import React from 'react';

import {TextAreaWithButton} from '../general/textAreaWithButton';

export class Settings extends React.Component {
    render() {
        const textAreaSettings = [
            {id: 'sushiPath', text: 'Sushi executable:', buttonText: 'Browse'},
            {
                id: 'mkvmergePath',
                text: 'mkvmerge executable:',
                buttonText: 'Browse',
            },
        ];

        const textAreaSettingComponents = textAreaSettings.map((item) => (
            <TextAreaWithButton
                key={item.id}
                style={{
                    container: this.props.style.layout.textSettingContainer,
                    headerContainer: this.props.style.layout.textSettingHeaderContainer,
                    text: this.props.style.settings.text,
                    textarea: this.props.style.settings.textarea,
                    button: this.props.style.settings.button,
                }}
                text={item.text}
                buttonText={item.buttonText}
                value={this.props.textAreaValues[item.id]}
                onChange={(event) => {
                    this.props.onTextAreaChange(event.target.value, item.id);
                }}
                onClick={() => this.props.pickExecutablePath(item.id)}
            />
        ));

        return (
            <div style={this.props.style.layout.settingsContainer}>
                {textAreaSettingComponents}
            </div>
        );
    }
}
