const path = require('path');
const os = require('os');

const {contextBridge, ipcRenderer} = require('electron');

// https://stackoverflow.com/a/59675116
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = [
            'close',
            'process-mkv',
            'stop-process',
            'minimize-window',
            'max-unmax-window',
            'is-window-maximized',
            'close-window',
            'save-state',
            'get-state',
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    sendSync: (channel, data) => {
        let validChannels = [];
        if (validChannels.includes(channel)) {
            return ipcRenderer.sendSync(channel, data);
        }
    },
    invoke: (channel, data) => {
        let validChannels = ['select-files'];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, data);
        }
    },
    on: (channel, func) => {
        let validChannels = [
            'close',
            'process-mkv',
            'log',
            'is-window-maximized',
            'save-state',
            'get-state',
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel) => {
        let validChannels = ['log', 'is-window-maximized', 'process-mkv'];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },
});

contextBridge.exposeInMainWorld('nodeModules', {path: path, EOL: os.EOL});
