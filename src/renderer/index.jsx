import React from 'react';
import {createRoot} from 'react-dom/client';
import {Root} from './components/navigation/root';
import '../styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <div
            className="index"
            onDragOver={(event) => {
                event.preventDefault();
            }}
            onDrop={(event) => {
                event.preventDefault();
            }}>
            <Root />
        </div>
    </React.StrictMode>,
);
