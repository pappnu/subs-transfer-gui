import React from 'react';
import {DraggableListItem} from './draggableListItem';

export function FileList({style, files, remove}) {
    const listItems = files.map((item, index) => (
        <DraggableListItem
            key={item.id}
            style={{
                container: style.listItem,
                button: style.button,
            }}
            id={item.id}
            index={index}
            item={
                <>
                    <div>{index + 1}.</div>
                    <div>{window.nodeModules.path.basename(item.path)}</div>
                </>
            }
            remove={remove}
        />
    ));
    return <ul style={style.list}>{listItems}</ul>;
}
