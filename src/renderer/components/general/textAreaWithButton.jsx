import React from 'react';
import {StyleableButton} from './StyleableButton';

export class TextAreaWithButton extends React.Component {
    render() {
        return (
            <div style={this.props.style.container}>
                <div style={this.props.style.headerContainer}>
                    <div style={this.props.style.text}>{this.props.text}</div>
                    <StyleableButton
                        style={this.props.style.button}
                        onClick={this.props.onClick}
                        text={this.props.buttonText}
                    />
                </div>
                <textarea
                    style={this.props.style.textarea}
                    value={this.props.value}
                    onChange={this.props.onChange}
                />
            </div>
        );
    }
}
