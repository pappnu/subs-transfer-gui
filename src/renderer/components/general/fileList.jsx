import React from 'react';

import {StyleableButton} from './StyleableButton';

export class FileList extends React.Component {
    render() {
        const listItems = this.props.files.map((item, index) => (
            <li style={this.props.style.listItem} key={index.toString()}>
                {item}
                <StyleableButton
                    style={{...this.props.style.button}}
                    onClick={() => {
                        this.props.remove(index);
                    }}
                    text={'✕'}
                />
            </li>
        ));
        return <ul style={this.props.style.list}>{listItems}</ul>;
    }
}
