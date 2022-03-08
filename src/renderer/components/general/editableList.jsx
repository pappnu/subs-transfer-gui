import React from 'react';

import {DropField} from './dropField';
import {FileList} from './fileList';
import {StyleableButton} from './styleableButton';

export function EditableList({
    style,
    header,
    addFiles,
    removeAll,
    handleOnDrop,
    files,
    remove,
    instructions,
}) {
    return (
        <div style={style.editableListContainer}>
            <div style={style.headerContainer}>
                <div style={style.fileList.header}>{header}</div>
                <div style={style.fileButtonsContainer}>
                    <StyleableButton
                        style={style.fileList.fileButton}
                        onClick={addFiles}
                        text={'Add files'}
                    />
                    <StyleableButton
                        style={style.fileList.fileButton}
                        onClick={removeAll}
                        text={'Remove all'}
                    />
                </div>
            </div>
            <DropField
                onDrop={handleOnDrop}
                style={style.fileListContainer}
                styleOnDragOver={style.fileListContainerDragOver}>
                {files.length > 0 ? (
                    <FileList
                        style={{
                            listItem: style.fileList.listItem,
                            list: style.fileList.list,
                            button: style.fileList.listButton,
                        }}
                        files={files}
                        remove={remove}
                    />
                ) : (
                    <div style={style.instructionsContainer}>
                        {instructions}
                    </div>
                )}
            </DropField>
        </div>
    );
}
