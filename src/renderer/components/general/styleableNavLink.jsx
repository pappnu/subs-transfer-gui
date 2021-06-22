import React from 'react';

import {NavLink} from 'react-router-dom';

export class StyleableNavLink extends React.Component {
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
        let activeStyle;
        switch (this.state.mouse) {
            case 'hover':
                style = this.props.style.hover;
                activeStyle = this.props.activeStyle.hover;
                break;

            case 'press':
                style = this.props.style.press;
                activeStyle = this.props.activeStyle.press;
                break;

            default:
                style = this.props.style.default;
                activeStyle = this.props.activeStyle.default;
                break;
        }
        return (
            <NavLink
                style={style}
                activeStyle={activeStyle}
                onMouseOver={this.onMouseOver}
                onMouseLeave={this.onMouseLeave}
                onMouseDown={this.onMouseDown}
                onMouseUp={this.onMouseUp}
                {...this.props.navLinkProps}>
                {this.props.text}
            </NavLink>
        );
    }
}
