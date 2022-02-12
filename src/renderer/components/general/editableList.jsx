import React from 'react';

import {DropField} from './dropField';
import {FileList} from './fileList';
import {StyleableButton} from './styleableButton';

export class EditableList extends React.Component {
    render() {
        return (
            <div style={this.props.style.editableListContainer}>
                <div style={this.props.style.headerContainer}>
                    <div style={this.props.style.fileList.header}>
                        {this.props.header}
                    </div>
                    <div style={this.props.style.fileButtonsContainer}>
                        <StyleableButton
                            style={this.props.style.fileList.fileButton}
                            onClick={this.props.addFiles}
                            text={'Add files'}
                        />
                        <StyleableButton
                            style={this.props.style.fileList.fileButton}
                            onClick={this.props.removeAll}
                            text={'Remove all'}
                        />
                    </div>
                </div>
                <DropField
                    onDrop={this.props.handleOnDrop}
                    style={this.props.style.fileListContainer}
                    styleOnDragOver={this.props.style.fileListContainerDragOver}>
                    {this.props.files.length > 0 ? (
                        <FileList
                            style={{
                                listItem: this.props.style.fileList.listItem,
                                list: this.props.style.fileList.list,
                                button: this.props.style.fileList.listButton,
                            }}
                            files={this.props.files}
                            remove={this.props.remove}
                        />
                    ) : (
                        <div style={this.props.style.instructionsContainer}>
                            {this.props.instructions}
                        </div>
                    )}
                </DropField>
            </div>
        );
    }
}
