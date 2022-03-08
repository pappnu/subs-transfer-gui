import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {StyleableButton} from './styleableButton';

export function DraggableListItem({style, id, index, item, remove}) {
    const {attributes, listeners, setNodeRef, transform, transition} =
        useSortable({id: id});

    return (
        <li
            ref={setNodeRef}
            style={{
                ...style.container,
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            {...attributes}
            {...listeners}>
            {item}
            <StyleableButton
                style={style.button}
                onClick={() => {
                    remove(index);
                }}
                text={'✕'}
            />
        </li>
    );
}
