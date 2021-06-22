import React from 'react';

export class StyleableButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            mouse: 'default',
        };
    }

    onMouseOver = () => {
        this.setState({mouse: 'hover'});
    };

    onMouseLeave = () => {
        this.setState({mouse: 'default'});
    };

    onMouseDown = () => {
        this.setState({mouse: 'press'});
    };

    onMouseUp = () => {
        this.setState({mouse: 'hover'});
    };

    render() {
        let style;
        switch (this.state.mouse) {
            case 'hover':
                style = this.props.style.hover;
                break;

            case 'press':
                style = this.props.style.press;
                break;

            default:
                style = this.props.style.default;
                break;
        }
        return (
            <button
                style={style}
                onMouseOver={this.onMouseOver}
                onMouseLeave={this.onMouseLeave}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                onClick={this.props.onClick}>
                {this.props.text}
            </button>
        );
    }
}
