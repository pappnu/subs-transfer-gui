import React from 'react';

export class DropField extends React.Component {
    handleOnDrop = (event) => {
        event.preventDefault();
        this.props.handleOnDrop(event);
    };

    handleOnDragOver = (event) => {
        event.preventDefault();
    };

    render() {
        return (
            <div
                onDragOver={this.handleOnDragOver}
                onDrop={this.handleOnDrop}
                style={this.props.style}>
                {this.props.children}
            </div>
        );
    }
}
