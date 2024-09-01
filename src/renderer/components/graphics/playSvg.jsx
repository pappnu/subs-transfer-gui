import React from 'react';

export function PlaySvg(props) {
    return (
        <svg {...props} viewBox="0 0 100 100">
            <polygon points="0 0,100 50,0 100,0 0" />
        </svg>
    );
}
