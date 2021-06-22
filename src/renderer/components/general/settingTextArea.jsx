import React from 'react';

export class SettingTextArea extends React.Component {
    render() {
        return (
            <div style={this.props.style.container}>
                <div style={this.props.style.text}>{this.props.text}</div>
                <textarea
                    style={this.props.style.textarea}
                    value={this.props.value}
                    onChange={this.props.onChange}
                />
            </div>
        );
    }
}
