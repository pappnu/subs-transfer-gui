import React from 'react';

export class SettingCheckbox extends React.Component {
    render() {
        return (
            <div style={this.props.style.container}>
                <div style={this.props.style.text}>{this.props.text}</div>
                <input
                    type={'checkbox'}
                    checked={this.props.checked}
                    onChange={this.props.onChange}
                />
            </div>
        );
    }
}
