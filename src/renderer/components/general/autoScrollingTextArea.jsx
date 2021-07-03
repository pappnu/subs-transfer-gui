import React from 'react';

export class AutoScrollingTextArea extends React.Component {
    constructor(props) {
        super(props);
        this.textLog = React.createRef();
    }

    componentDidUpdate() {
        if (this.textLog.current !== document.activeElement) {
            this.textLog.current.scrollTop = this.textLog.current.scrollHeight;
        }
    }

    render() {
        return (
            <textarea
                ref={this.textLog}
                style={this.props.style}
                disabled={this.props.disabled}
                readOnly={this.props.readOnly}
                value={this.props.value}
            />
        );
    }
}
