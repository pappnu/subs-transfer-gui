import React from 'react';

import {SettingTextArea} from '../general/settingTextArea';

export class Settings extends React.Component {
    render() {
        const textAreaSettings = [
            {id: 'sushiPath', text: 'Sushi executable:'},
            {id: 'mkvmergePath', text: 'mkvmerge executable:'},
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
                value={this.props.textAreaValues[item.id]}
                onChange={(event) => {
                    this.props.onTextAreaChange(event.target.value, item.id);
                }}
            />
        ));

        return <div style={this.props.style.layout.settingsContainer}>
            {textAreaSettingComponents}
        </div>;
    }
}
