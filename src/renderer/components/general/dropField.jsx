import React, {useState} from 'react';

export function DropField({style, styleOnDragOver, onDrop, children}) {
    const [activeStyle, setActiveStyle] = useState(style);

    const handleOnDrop = (event) => {
        event.preventDefault();
        setActiveStyle(style);
        onDrop(event);
    };

    const handleOnDragOver = (event) => {
        event.preventDefault();
        setActiveStyle(styleOnDragOver);
    };

    const handleOnDragLeave = (event) => {
        event.preventDefault();
        setActiveStyle(style);
    };

    return (
        <div
            onDragOver={handleOnDragOver}
            onDragLeave={handleOnDragLeave}
            onDrop={handleOnDrop}
            style={activeStyle}>
            {children}
        </div>
    );
}
