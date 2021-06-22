import React from 'react';
import ReactDOM from 'react-dom';
import {Root} from './components/navigation/root';
import '../styles/index.css';

ReactDOM.render(
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
    document.getElementById('root'),
);
